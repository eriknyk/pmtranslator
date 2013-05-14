<?php
error_reporting(E_ALL);
$config = parse_ini_file('config.ini');

$config['base_url'] = rtrim($config['base_url'], '/') . '/'; // to ensure that always have a slash at string ending

//print_r($config);

//echo '<pre>';print_r($_SERVER); die;

define('HOME_DIR', dirname(__FILE__));

$url = explode('?', $_SERVER['REQUEST_URI']);
$url = $url[0];
$url = explode('/', trim(str_replace($config['base_url'], '', $url), '/'));


$controller = empty($url[0]) ? 'Main': $url[0];
$action = empty($url[1]) ? 'index': $url[1];

$controllerFile = 'src'.DIRECTORY_SEPARATOR.ucfirst($controller) . ".php";

//var_dump($controller, $action); die;

try {
    if (! file_exists($controllerFile)) {
        throw new Exception("Controller '$controller' does not exist");
    }

    require $controllerFile;

    if (! class_exists($controller)) {
        throw new Exception("Controller Class '$controller' does not exist");
    }

    $c = new $controller();
    $c->config = $config;

    if (! method_exists($c, $action)) {
        throw new Exception("Action '$controller/$action' does not exist");
    }

    $c->$action();
} catch (Exception $e) {
    header('HTTP/1.0 404 Not Found');

    echo 'ERROR: ' . $e->getMessage();
}
