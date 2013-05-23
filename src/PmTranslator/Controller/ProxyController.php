<?php

namespace PmTranslator\Controller;

use Silex\Application;
use Silex\ControllerProviderInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

class ProxyController implements ControllerProviderInterface
{
    public function connect(Application $app)
    {
        $route = $app['controllers_factory'];
        $me = $this;

        ///
        /// GET: /proxy/getProjects
        ///
        $route->get('/proxy/getProjects', function() use ($app) {
            $model = $app['model'];
            $model->setTarget('PROJECT');
            $projectsList = $model->select();
            $projects = array();

            foreach ($projectsList as $proj) {
                $projects[] = array(
                    'ID' => $proj['PROJECT_ID'],
                    'NAME' => $proj['PROJECT_NAME'] . ' ('.$proj['LOCALE'].' -> '.$proj['TARGET_LOCALE'].')'
                );
            }

            return $app->json($projects, 201);
        })->bind('getProjects');


        ///
        /// GET: /proxy/getLanguages
        ///
        $route->get('/proxy/getLanguages', function() use ($app) {
            $model = $app['model'];
            $model->setTarget('LANGUAGE');
            $languages = $model->select();

            return $app->json($languages, 201);
        })->bind('getLanguages');

        ///
        /// GET: /proxy/getCountries
        ///
        $route->get('/proxy/getCountries', function() use ($app) {
            $model = $app['model'];
            $model->setTarget('COUNTRY');
            $countries = $model->select();

            return $app->json($countries, 201);
        })->bind('getCountries');

        ///
        /// GET: /proxy/data
        ///
        $route->get('/proxy/data', function() use ($app, $me) {
            if (empty($_REQUEST) || ! isset($_REQUEST['project'])) {
                return $me->updateRecord();
            }

            $project = $_REQUEST['project'];
            $untranslatedFilter = array_key_exists('untranslatedFilter', $_REQUEST) ? $_REQUEST['untranslatedFilter'] : false;

            $model = $app['model'];

            $data  = array();
            $start = isset($_REQUEST['start']) ? $_REQUEST['start']: 0;
            $limit = isset($_REQUEST['limit']) ? $_REQUEST['limit']: 25;
            $sort  = isset($_REQUEST['sort']) ? $_REQUEST['sort']: null;
            $dir   = isset($_REQUEST['dir']) ? $_REQUEST['dir']: null;

            $filter = isset($_REQUEST['searchTerm']) ? strtoupper($_REQUEST['searchTerm']) : false;
            $where = '';

            if ($filter !== false) {
                $where = "WHERE UPPER(MSG_STR) LIKE '%$filter%' OR UPPER(TRANSLATED_MSG_STR) LIKE '%$filter%'";
            }

            if (! empty($untranslatedFilter)) {
                $where .= empty($where) ? 'WHERE ' : ' AND ';
                $where .= 'MSG_STR=TRANSLATED_MSG_STR';
            }

            $orderBy = "ORDER BY ID ASC";
            if (! empty($sort)) {
                $orderBy = "ORDER BY $sort $dir";
            }

            $result = $model->query("SELECT * FROM $project $where $orderBy LIMIT $start,$limit");
            $resultSet = $model->query("SELECT COUNT(*) AS TOTAL FROM $project $where");

            if ($resultSet) {
                $allRowsCount = $resultSet->fetch();
                $totalCount = $allRowsCount['TOTAL'];
            } else {
                $result = array();
                $totalCount = 0;
            }

            $rows = array();

            foreach($result as $row) {
                $rows[] = array(
                    'ID' => $row['ID'],
                    'MSG_STR' => $row['MSG_STR'],
                    'TRANSLATED_MSG_STR' => $row['TRANSLATED_MSG_STR']
                );
            }

            $data['data'] = $rows;
            $data['totalCount'] = $totalCount;

            return $app->json($data, 201);
        })->bind('get-data');


        ///
        /// POST: /proxy/data
        ///
        $route->post('/proxy/data', function() use ($app) {
            $model = $app['model'];
            $result = new \StdClass();
            $raw  = '';
            $httpContent = fopen('php://input', 'r');

            while ($kb = fread($httpContent, 1024)) {
                $raw .= $kb;
            }

            $_REQUEST = (array) json_decode(stripslashes($raw));

            $project = $_REQUEST['project'];
            $data = $_REQUEST['data'];

            $model->setTarget($project);


            try {
                $model->update(
                    array('TRANSLATED_MSG_STR' => trim($data->TRANSLATED_MSG_STR)),
                    array('ID' => $data->ID)
                );

                $model->setTarget('PROJECT');
                $model->update(array('UPDATE_DATE' => date('Y-m-d H:i:s')), array('PROJECT_NAME' => $project));

                $result->success = true;
                $result->message = 'Updated Successfully!';
                $result->data = $data;
            } catch (Exception $e) {
                $result->success = false;
                $result->message = $e->getMessage();
            }

            return $app->json($result, 201);
        })->bind('getCountries');


        return $route;
    }
}













