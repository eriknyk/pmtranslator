<?php

namespace PmTranslator\Controller;

use Silex\Application;
use Silex\ControllerProviderInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

use PmTranslator\Util\PoHandler;

/**
 * Task Controller
 *
 * @author Erik Amaru Ortiz <aortiz.erik@gmail.com>
 */
class TaskController implements ControllerProviderInterface
{
    public function connect(Application $app)
    {
        $route = $app['controllers_factory'];

        ///
        /// POST: /task/upload
        ///
        $route->post('/task/upload', function() use ($app) {
            //return $app->json(array('success'=>true), 200);
            //print_r($_REQUEST); die;
            set_time_limit(0);

            $type = $_REQUEST['type'];
            $tmpDir = $app->getPath() . 'cache/';
            $poFile = $tmpDir . $_FILES['po_file']['name'];
            $locale = '';
            $results = new \StdClass();
            $model = $app['model'];

            try {
                if (! array_key_exists('project', $_REQUEST)) {
                    throw new \Exception("Bad Request: Param 'project' is missing.");
                }

                $projectName = $_REQUEST['project'];

                // if (empty($result)) {
                //     throw new \Exception("Error: Project '$projectName' does not exist!");
                // }

                if (! is_dir($tmpDir)) {
                    mkdir($tmpDir);
                    chmod($tmpDir, 0777);
                }

                move_uploaded_file($_FILES['po_file']['tmp_name'], $poFile);

                $poHandler = new PoHandler($poFile); //$app['PoHandler']; //
                //$poHandler->setFile($poFile)
                $poHandler->readInit();
                $poHeaders = $poHandler->getHeaders();
                //print_r($poHeaders);

                // resolve locale
                $locale = $model->resolveLocale($poHeaders['X-Poedit-Country'], $poHeaders['X-Poedit-Language']);

                ////
                $countItems = 0;
                $updatedItems = 0;
                $updatedTranslationsItems = 0;
                $countItemsSuccess = 0;
                $errorMsg = '';

                if ($model->projectExists($projectName)) {
                    // project already exists, so it is a request to update project
                    $model->setTarget('PROJECT');
                    $result = $model->select('*', array('PROJECT_NAME' => $projectName)); // load project data
                    $project = $result[0];

                    if ($type == 'source') {
                        // the project already exists, we need validate that this .po locale must be the same at created project
                        //print_r($locale,$project['LOCALE']);
                        if ($locale != $project['LOCALE']) {
                            throw new \Exception(
                                "Error: Invalid languaje on .po source, it must be the same at the project.<br/>".
                                "Given: $locale - Expected: {$project['LOCALE']}"
                            );
                        }
                    }
                } else {
                    $model->createProject($projectName);
                }

                $model->setTarget($projectName);

                while ($rowTranslation = $poHandler->getTranslation()) {
                    if (! isset( $poHandler->translatorComments[0] ) || ! isset( $poHandler->translatorComments[1] ) || ! isset( $poHandler->references[0] )) {
                        throw new \Exception( 'The .po file doesn\'t have valid directives for Processmaker!' );
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
                        $where = array(
                            'REF_1' => $poHandler->translatorComments[0],
                            'REF_2' => $poHandler->translatorComments[1],
                            'REF_LOC' => $poHandler->references[0],
                        );
                        $matchRecord = $model->select('*', $where);

                        if (! empty($matchRecord)) {
                            $matchRecord = $matchRecord[0];
                            if ($matchRecord['MSG_ID'] !== $rowTranslation['msgid']) {
                                $updatedItems++;
                                $model->update(array('MSG_STR' => $rowTranslation['msgid']), $where);
                            }

                        } else {
                            $countItems++;
                            $model->save($record);
                        }

                    } elseif ($type == 'target') {
                        $record = array(
                            // this apply trim() is a dummy solutions for accidental blank spaces on target .po
                            'REF_1' => trim($poHandler->translatorComments[0]),
                            'REF_2' => trim($poHandler->translatorComments[1]),
                            'REF_LOC' => trim($poHandler->references[0]),
                            //'MSG_ID' => $rowTranslation['msgid'] // <- some people have modified even this record
                        );

                        $matchRecord = $model->select('*', $record);

                        if (! empty($matchRecord)) {
                            $matchRecord = $matchRecord[0];
                            // update only if the string never was updated by the user
                            // if it does skip update to prevent overwrite the user changes
                            // it is considered the last valid change, those that was made by the user and not incoming changes froom .po file
                            if ($matchRecord['MSG_STR'] == $matchRecord['TRANSLATED_MSG_STR']) {
                                $updatedTranslationsItems++;
                                $res = $model->update(array('TRANSLATED_MSG_STR'=> $rowTranslation['msgstr']), $record);

                                if ($res == 0) {
                                    //$this->log('UPDATE FAILED!');
                                    //$this->log($model->getLastSql());
                                }
                            } else {
                                //$this->log('SKIPPED: ' . $matchRecord['MSG_ID'] .'=='. $matchRecord['TRANSLATED_MSG_STR'] ."  ---> ". $model->getLastSql());
                            }
                        } else {
                            //$this->log('NOT FOUND:');
                            //$this->log($model->getLastSql());
                        }
                    }
                }

                if ($type == 'source') {
                    $model->setTarget('PROJECT');
                    $record = array(
                        'COUNTRY' => ($poHeaders['X-Poedit-Country'] != '.' ? $poHeaders['X-Poedit-Country'] : ''),
                        'LANGUAGE' => $poHeaders['X-Poedit-Language'],
                        'NUM_RECORDS' => $countItems,
                        'LOCALE' => $locale
                    );

                    if (array_key_exists('Country', $_REQUEST)) {
                        $record['TARGET_COUNTRY'] = $_REQUEST['Country'];
                        $record['TARGET_LANGUAGE'] = $_REQUEST['Language'];
                        $record['TARGET_LOCALE'] = $model->resolveLocale($_REQUEST['Country'], $_REQUEST['Language']);
                    }
                    $res = $model->update(
                        $record,
                        array('PROJECT_NAME' => $_REQUEST['project'])
                    );

                    $app->log($model->getLastSql());
                }

                $results->success = true;
                $results->recordsCount = $countItems;
                $results->message = "Process completed successfuly!<br/><br/>" .
                                    "New Records: $countItems<br/>" .
                                    "Updated Source Records: $updatedItems<br/>" .
                                    "Updated Translations Records: $updatedTranslationsItems";
            } catch (\Exception $e) {
                $results->success = false;
                $results->message = $e->getMessage();
            }

            $results->message = htmlentities($results->message);

            return new Response(json_encode($results , JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT));

            //return $app->json(array(), 502);
        })->bind('task-upl');

        ///
        /// GET: /task/export
        ///
        $route->get('/task/export', function() use ($app) {

            //require_once 'lib/class.i18n_po.php';

            set_time_limit(0);

            $projectName = $_REQUEST['project'];
            $language = $_REQUEST['country'];
            $country = $_REQUEST['language'];
            $version = '2.0';
            $tmpDir = $app->getPath() . 'cache/';

            $model = $app['model'];

            $model->setTarget('PROJECT');
            $result = $model->select('*', array('PROJECT_NAME' => $projectName));

            if (empty($result)) {
                throw new Exception("ERROR: Project '$projectName' does not exist!");
            }

            $project = $result[0];
            $locale = $project['TARGET_LOCALE'];

            $model->setTarget($projectName);
            $rows = $model->select();

            $filename = $tmpDir . $projectName.'.'.$locale . '.po';

            $poFile = new PoHandler($filename);
            $poFile->buildInit();

            //setting headers
            $poFile->addHeader('Project-Id-Version', ucfirst(strtolower($projectName)) .' - '.$version);
            $poFile->addHeader('POT-Creation-Date', '');
            $poFile->addHeader('PO-Revision-Date', date('Y-m-d H:i:s'));
            $poFile->addHeader('Last-Translator', '');
            $poFile->addHeader('Language-Team', '');
            $poFile->addHeader('MIME-Version', '1.0');
            $poFile->addHeader('Content-Type', 'text/plain; charset=utf-8');
            $poFile->addHeader('Content-Transfer_Encoding', '8bit');
            $poFile->addHeader('X-Poedit-Language', $language);
            $poFile->addHeader('X-Poedit-Country', $country );
            $poFile->addHeader('X-Poedit-SourceCharset', 'utf-8');
            $poFile->addHeader('Content-Transfer-Encoding', '8bit');

            foreach ($rows as $row) {
                $poFile->addTranslatorComment( $row['REF_1'] );
                $poFile->addTranslatorComment( $row['REF_2'] );
                $poFile->addReference( $row['REF_LOC'] );

                $poFile->addTranslation( stripcslashes( $row['MSG_ID'] ), stripcslashes( $row['TRANSLATED_MSG_STR'] ) );
                //$poFile->addTranslation( $row['MSG_ID'], $row['TRANSLATED_MSG_STR'] );
            }

            $stream = function () use ($filename) {
                readfile($filename);
            };

            return $app->stream($stream, 200, array(
                'Content-Type' => 'octet-stream',
                'Content-length' => filesize($filename),
                'Content-Disposition' => 'attachment; filename="'.basename($filename).'"'
            ));
        })->bind('task-export');

        return $route;
    }
}













