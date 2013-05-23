<?php

if (!isset($config)) {
    die("No configuration object provided.");
}

if (!is_writable(__DIR__ . DIRECTORY_SEPARATOR . 'cache')) {
    die(sprintf('The "%s" folder must be writable for GitList to run.', __DIR__ . DIRECTORY_SEPARATOR . 'cache'));
}

// Startup and configure Silex application
$app = new PmTranslator\Application($config, __DIR__);

// Mount the controllers
$app->mount('', new PmTranslator\Controller\MainController());
$app->mount('', new PmTranslator\Controller\ProxyController());
// $app->mount('', new GitList\Controller\CommitController());
// $app->mount('', new GitList\Controller\TreeController());

return $app;
