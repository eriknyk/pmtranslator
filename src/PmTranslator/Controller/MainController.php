<?php

namespace PmTranslator\Controller;

use Silex\Application;
use Silex\ControllerProviderInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

/**
 * Main Controller
 *
 * @author Erik Amaru Ortiz <aortiz.erik@gmail.com>
 */
class MainController implements ControllerProviderInterface
{
    public function connect(Application $app)
    {
        $route = $app['controllers_factory'];

        ///
        /// GET: /
        ///
        $route->get('/', function() use ($app) {
            // return $app['twig']->render('index.twig', array(
            //     'name'   => 'erik',
            // ));

            return $app->redirect($app['url_generator']->generate('/translate'));
        })->bind('homepage');

        ///
        /// GET: /translate
        ///
        $route->get('/translate', function() use ($app) {

            $model = $app['model'];

            $model->setTarget('PROJECT');
            $projectsList = $model->select();
            $projects = array();

            if (! isset($_GET['id'])) {
                if (isset($_GET['project'])) {
                    $rows = $model->select('*', array('PROJECT_NAME' => $_GET['project']));
                    if (count($rows) > 0) {
                        $_GET['id'] = $rows[0]['PROJECT_ID'];
                    }
                }
            }

            if (! isset($_GET['id'])) {
                $project = count($projectsList) > 0 ? $projectsList[0] : array();
            } else {
                foreach ($projectsList as $proj) {
                    if ($proj['PROJECT_ID'] == $_GET['id']) {
                        $project = $proj;
                        break;
                    }
                }

                if (empty($project)) {
                    echo 'Project does not exist!';
                    die;
                }
            }

            $options = $app['options'];

            $defaultOptions = array(
                'new_project'=>1,
                'update_project'=>1,
                'update_translations'=>1,
                'export_translations'=>1
            );

            foreach ($options as $key => $value) {
                $options[$key] = $value == '1' || $value == 'true' ? true : false;
            }

            $options = array_merge($defaultOptions, $options);

            foreach ($projectsList as $proj) {
                $projects[] = array($proj['PROJECT_NAME'] . ' ('.$proj['TARGET_LOCALE'].')');
            }

            //var_dump($projects); die;

            return $app['twig']->render('translate.twig', array(
                'projects' => $projects,
                'project'  => $project,
                'options'  => $options,
                'base_url' => '/pmtranslator',
            ));
        })->bind('/translate');

        return $route;
    }
}













