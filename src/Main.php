<?php

require_once 'model/Translation.php';

class Main
{
    public function index()
    {
        $translation = new Translation();

        $translation->setTarget('PROJECT');
        $rows = $translation->select();
        $projects = array();

        $defaultProject = count($rows) > 0 ? $rows[0]['PROJECT_NAME'] : '';

        foreach ($rows as $row) {
            $projects[] = array($row['PROJECT_NAME']);
        }

        include 'view/main.php';
    }

    public function dataView()
    {
        $project = $_REQUEST['project'];

        $translation = new Translation();

        $data  = array();
        $start = isset($_POST['start']) ? $_POST['start']: 0;
        $limit = isset($_POST['limit']) ? $_POST['limit']: 25;
        $sort  = isset($_POST['sort']) ? $_POST['sort']: null;
        $dir   = isset($_POST['dir']) ? $_POST['dir']: null;

        $filter = isset($_POST['searchTerm']) ? strtoupper($_POST['searchTerm']) : false;
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
                'MSG_STR' => $row['MSG_STR'],
                'TRANSLATED_MSG_STR' => $row['TRANSLATED_MSG_STR']
            );
        }

        $data['data'] = $rows;
        $data['totalCount'] = $allRowsCount['TOTAL'];

        echo json_encode($data);
        //$this->set('data', $data);

    }

    ///

    public function upload()
    {
        set_time_limit(0);

        require_once 'lib/class.i18n_po.php';
        $type = $_REQUEST['type'];
        $tmpDir = HOME_DIR . '/tmp/';
        $poFile = $tmpDir . $_FILES['po_file']['name'];

        if (! is_dir($tmpDir)) {
            mkdir($tmpDir);
            chmod($tmpDir, 0777);
        }

        move_uploaded_file($_FILES['po_file']['tmp_name'], $poFile);

        $poHandler = new i18n_PO($poFile);
        $poHandler->readInit();
        $poHeaders = $poHandler->getHeaders();
        //print_r($poHeaders);

        if ($type == 'source') {
            if (strtolower($poHeaders['X-Poedit-Language']) != 'english') {
                throw new Exception("Error: Invalid source languaje");
            }
        }

        switch (strtolower($poHeaders['X-Poedit-Language']).'-'.strtolower($poHeaders['X-Poedit-Country'])) {
            case 'english-.': $LOCALE = 'en'; break;
            case 'oortuguese-.': $LOCALE = 'pt'; break;
            case 'portuguese-brazil.': $LOCALE = 'pt-BR'; break;
            default: $LOCALE = 'pt'; break;
        }


        $countItems = 0;
        $countItemsSuccess = 0;
        $errorMsg = '';

        $translation = new Translation();

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
                // verify if record already exists

                $record = array(
                    'REF_1' => $poHandler->translatorComments[0],
                    'REF_2' => $poHandler->translatorComments[1],
                    'REF_LOC' => $poHandler->references[0],
                    'MSG_ID' => $rowTranslation['msgid'],
                    'MSG_STR' => $rowTranslation['msgstr'],
                    'TRANSLATED_MSG_STR' => $rowTranslation['msgstr'],
                    'SOURCE_LANG' => $LOCALE
                );
            }

            $translation->save($record);
        }

        $info = array();

        $info['source_language'] = $poHeaders['X-Poedit-Language'];
        $info['records_count'] = $countItems;
        $info['source_last_update'] = date('Y-m-d H:i:s');


        $results = new stdClass();
        $results->success = true;
        $results->recordsCount = $countItems;
        $results->message = "Imported ($countItems) labels.";

        echo  json_encode($results);
    }
}

