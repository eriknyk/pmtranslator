<?php

require_once 'model/Translation.php';

class Main
{
    public $config;

    public function index()
    {
        $translation = new Translation();

        $translation->setTarget('PROJECT');
        $projectsList = $translation->select();
        $projects = array();
        //var_dump($_GET); die;
        if (isset($_GET['project'])) {
            foreach ($projectsList as $proj) {
                if ($proj['PROJECT_NAME'] == $_GET['project']) {
                    $project = $proj;
                    break;
                }
            }
        }

        if (empty($project)) {
            $project = count($projectsList) > 0 ? $projectsList[0] : array();
        }

        $config = $this->config;

        foreach ($projectsList as $proj) {
            $projects[] = array($proj['PROJECT_NAME']);
        }

        include 'view/main.php';
    }

    public function api()
    {
        if (empty($_REQUEST)) {
            return $this->updateRecord();
        }

        $project = $_REQUEST['project'];

        $translation = new Translation();

        $data  = array();
        $start = isset($_REQUEST['start']) ? $_REQUEST['start']: 0;
        $limit = isset($_REQUEST['limit']) ? $_REQUEST['limit']: 25;
        $sort  = isset($_REQUEST['sort']) ? $_REQUEST['sort']: null;
        $dir   = isset($_REQUEST['dir']) ? $_REQUEST['dir']: null;

        $filter = isset($_REQUEST['searchTerm']) ? strtoupper($_REQUEST['searchTerm']) : false;
        $where = '';

        if ($filter !== false) {
            $where = "WHERE MSG_STR LIKE '%$filter%' OR TRANSLATED_MSG_STR LIKE '%$filter%'";
        }

        $orderBy = "ORDER BY ID ASC";
        if (! empty($sort)) {
            $orderBy = "ORDER BY $sort $dir";
        }

        $result = $translation->query("SELECT * FROM $project $where $orderBy LIMIT $start,$limit");
        $allRowsCount = $translation->query("SELECT COUNT(*) AS TOTAL FROM $project")->fetch();

        $rows = array();

        foreach($result as $row) {
            $rows[] = array(
                'ID' => $row['ID'],
                'MSG_STR' => $row['MSG_STR'],
                'TRANSLATED_MSG_STR' => $row['TRANSLATED_MSG_STR']
            );
        }

        $data['data'] = $rows;
        $data['totalCount'] = $allRowsCount['TOTAL'];

        echo json_encode($data);
        //$this->set('data', $data);

    }

    public function updateRecord()
    {
        $result = new stdClass();
        $raw  = '';
        $httpContent = fopen('php://input', 'r');
        while ($kb = fread($httpContent, 1024)) {
            $raw .= $kb;
        }
        $_REQUEST = (array) json_decode(stripslashes($raw));

        $project = $_REQUEST['project'];
        $data = $_REQUEST['data'];

        $translation = new Translation();
        $translation->setTarget($project);


        try {
            $translation->update(
                array('TRANSLATED_MSG_STR' => $data->TRANSLATED_MSG_STR),
                array('ID' => $data->ID)
            );

            $result->success = true;
            $result->message = 'Updated Successfully!';
            $result->data = $data;
        } catch (Exception $e) {
            $result->success = false;
            $result->message = $e->getMessage();
        }

        echo json_encode($result);
        //{"success":true,"message":"Created new User","data":{"first":"ee","last":"ee","email":"ee","id":10}}
    }

    ///

    public function upload()
    {
        set_time_limit(0);

        require_once 'lib/class.i18n_po.php';
        $type = $_REQUEST['type'];
        $tmpDir = HOME_DIR . '/tmp/';
        $poFile = $tmpDir . $_FILES['po_file']['name'];
        $locale = '';
        $results = new stdClass();
        $translation = new Translation();

        if (! is_dir($tmpDir)) {
            mkdir($tmpDir);
            chmod($tmpDir, 0777);
        }

        try {
            move_uploaded_file($_FILES['po_file']['tmp_name'], $poFile);

            $poHandler = new i18n_PO($poFile);
            $poHandler->readInit();
            $poHeaders = $poHandler->getHeaders();
            //print_r($poHeaders);

            if ($type == 'source') {
                //TODO currently we only accepts english languages as project base translations
                if (strtolower($poHeaders['X-Poedit-Language']) != 'english') {
                    throw new Exception("Error: Invalid source languaje");
                }
            }

            // resolve locale
            $locale = self::resolveLocale($poHeaders['X-Poedit-Country'], $poHeaders['X-Poedit-Language']);

            ////
            $countItems = 0;
            $countItemsSuccess = 0;
            $errorMsg = '';

            // if $_REQUEST['project_name'] is passed as param a new project should be created
            if (! $translation->projectExists($_REQUEST['project'])) {
                 $translation->createProject($_REQUEST['project']);
            }

            $translation->setTarget($_REQUEST['project']);


            while ($rowTranslation = $poHandler->getTranslation()) {
                $countItems ++;

                if (! isset( $poHandler->translatorComments[0] ) || ! isset( $poHandler->translatorComments[1] ) || ! isset( $poHandler->references[0] )) {
                    throw new Exception( 'The .po file doesn\'t have valid directives for Processmaker!' );
                }

                if ($type == 'source') {
                    $record = array(
                        'REF_1' => $poHandler->translatorComments[0],
                        'REF_2' => $poHandler->translatorComments[1],
                        'REF_LOC' => $poHandler->references[0],
                        'MSG_ID' => $rowTranslation['msgid'],
                        'MSG_STR' => $rowTranslation['msgstr'],
                        'TRANSLATED_MSG_STR' => $rowTranslation['msgstr'],
                        'SOURCE_LANG' => $locale
                    );

                    // verify if record already exists

                    $translation->save($record);
                } elseif ($type == 'target') {
                    $record = array(
                        'REF_1' => $poHandler->translatorComments[0],
                        'REF_2' => $poHandler->translatorComments[1],
                        'REF_LOC' => $poHandler->references[0],
                        'MSG_ID' => $rowTranslation['msgid']
                    );

                    $translation->update(array('TRANSLATED_MSG_STR'=> $rowTranslation['msgstr']), $record);
                }
            }

            if ($type == 'source') {
                $translation->setTarget('PROJECT');
                $record = array(
                    'COUNTRY' => ($poHeaders['X-Poedit-Country'] != '.' ? $poHeaders['X-Poedit-Country'] : ''),
                    'LANGUAGE' => $poHeaders['X-Poedit-Language'],
                    'NUM_RECORDS' => $countItems,
                    'LOCALE' => $locale
                );

                if (array_key_exists('Country', $_REQUEST)) {
                    $record['TARGET_COUNTRY'] = $_REQUEST['Country'];
                    $record['TARGET_LANGUAGE'] = $_REQUEST['Language'];
                    $record['TARGET_LOCALE'] = self::resolveLocale($_REQUEST['Country'], $_REQUEST['Language']);
                }
                $translation->update(
                    $record,
                    array('PROJECT_NAME' => $_REQUEST['project'])
                );
            }

            $results->success = true;
            $results->recordsCount = $countItems;
            $results->message = "Imported ($countItems) labels.";
        } catch (Exception $e) {
            $results->success = false;
            $results->message = $e->getMessage();
        }


        echo json_encode($results);
    }

    public function getCountries()
    {
        $translation = new Translation();
        $translation->setTarget('COUNTRY');
        $countries = $translation->select();

        echo json_encode($countries);
    }

    public function getLanguages()
    {
        $translation = new Translation();
        $translation->setTarget('LANGUAGE');
        $languages = $translation->select();

        echo json_encode($languages);
    }

    public function export()
    {
        require_once 'lib/class.i18n_po.php';

        set_time_limit(0);

        $project = $_REQUEST['project'];
        $country = $_REQUEST['country'];
        $language = $_REQUEST['language'];
        $locale = self::resolveLocale($country, $language);
        $version = '2.0';
        $tmpDir = HOME_DIR . '/tmp/';

        $translation = new Translation();
        $translation->setTarget($project);

        $rows = $translation->select();

        $filename = $tmpDir . $project.'.'.$locale . '.po';

        $poFile = new i18n_PO( $filename );
        $poFile->buildInit();

        //setting headers
        $poFile->addHeader( 'Project-Id-Version', ucfirst(strtolower($project)) .' - '.$version);
        $poFile->addHeader( 'POT-Creation-Date', '' );
        $poFile->addHeader( 'PO-Revision-Date', date( 'Y-m-d H:i:s' ) );
        $poFile->addHeader( 'Last-Translator', '' );
        $poFile->addHeader( 'Language-Team', '' );
        $poFile->addHeader( 'MIME-Version', '1.0' );
        $poFile->addHeader( 'Content-Type', 'text/plain; charset=utf-8' );
        $poFile->addHeader( 'Content-Transfer_Encoding', '8bit' );
        $poFile->addHeader( 'X-Poedit-Language', $language );
        $poFile->addHeader( 'X-Poedit-Country', $country );
        $poFile->addHeader( 'X-Poedit-SourceCharset', 'utf-8' );
        $poFile->addHeader( 'Content-Transfer-Encoding', '8bit' );

        foreach ($rows as $row) {
            $poFile->addTranslatorComment( $row['REF_1'] );
            $poFile->addTranslatorComment( $row['REF_2'] );
            $poFile->addReference( $row['REF_LOC'] );

            $poFile->addTranslation( stripcslashes( $row['MSG_ID'] ), stripcslashes( $row['TRANSLATED_MSG_STR'] ) );
            //$poFile->addTranslation( $row['MSG_ID'], $row['TRANSLATED_MSG_STR'] );
        }

        header( 'Content-Disposition: attachment; filename="' . basename($filename) . '"' );
        header( 'Content-Type: application/octet-stream' );

        $userAgent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

        if (preg_match( "/msie/i", $userAgent )) {
            //if ( ereg("msie", $userAgent)) {
            header( 'Pragma: cache' );

            if (file_exists( $poFile )) {
                $mtime = filemtime( $poFile );
            } else {
                $mtime = date( 'U' );
            }
            $gmt_mtime = gmdate( "D, d M Y H:i:s", $mtime ) . " GMT";
            header( 'ETag: "' . md5( $mtime . $poFile ) . '"' );
            header( "Last-Modified: " . $gmt_mtime );
            header( 'Cache-Control: public' );
            header( "Expires: " . gmdate( "D, d M Y H:i:s", time() + 60 * 10 ) . " GMT" ); //ten minutes
            return;
        }
        readfile($filename);
    }

    protected static function resolveLocale($countryParam, $languageParam)
    {
        $translation = new Translation();
        $translation->setTarget('LANGUAGE');
        $result = $translation->select('*', array('LAN_NAME' => $languageParam));

        if (count($result) > 0) {
            $language = $result[0];
        }

        $translation->setTarget('COUNTRY');
        $result = $translation->select('*', array('IC_NAME' => $countryParam));

        if (count($result) > 0) {
            $country = $result[0];
        }

        // compose locale
        if (empty($language)) {
            throw new Exception("Error: Unknown or invalid languaje");
        }

        $locale = $language['LAN_ID'];

        if (! empty($country)) {
            $locale .= '_'.$country['IC_UID'];
        }

        return $locale;
    }
}

