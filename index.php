<?php
error_reporting(E_ALL);

if (! file_exists('config.ini')) {
    echo 'Configuration file is missing!<br />';
    echo 'Please make a copy of config.ini-dist with name config.ini, and configure settings.';
    exit;
}

define('HOME_DIR', dirname(__FILE__));
function pr ($v) { echo "<pre>".print_r($v, true)."</pre>";}

$config = parse_ini_file('config.ini');
$config['base_url'] = rtrim($config['base_url'], '/') . '/';
$url = explode('?', $_SERVER['REQUEST_URI']);
$url = $url[0];


if (substr($url, 0, strlen($config['base_url'])) == $config['base_url']) {
    $url = substr($url, strlen($config['base_url']));
}

$url = explode('/', $url);

//pr($url); die;
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
