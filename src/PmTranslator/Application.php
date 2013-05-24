<?php

namespace PmTranslator;

use Silex\Application as SilexApplication;
use Silex\Provider\TwigServiceProvider;
use Silex\Provider\UrlGeneratorServiceProvider;

use PmTranslator\Provider\ModelServiceProvider;
use PmTranslator\Provider\PoHandlerServiceProvider;


/**
 * PmTranslator application.
 */
class Application extends \Silex\Application
{
    protected $path;
    protected $logging = false;
    protected $loggingFp;

    /**
     * Constructor initialize services.
     *
     * @param Config $config
     * @param string $root   Base path of the application files (views, cache)
     */
    public function __construct(Config $config, $root = null)
    {
        parent::__construct();
        $app = $this;
        $this->path = realpath($root);

        $this['debug'] = $config->get('app', 'debug');
        $this['database'] = $config->getSection('database');
        $this['options'] = $config->getSection('options');

        $this->logging = $config->get('app', 'logging') ? true : false;

        if ($this->logging) {
            $this->enableLogging(true);
        }

        // Register services
        $this->register(new TwigServiceProvider(), array(
            'twig.path'       => $this->getViewPath(),
            'twig.options'    => array('cache' => $this->getCachePath() . 'views'),
        ));

        $repositories = $config->get('git', 'repositories');
        $repositoryCache = $config->get('app', 'cached_repos');
        if (false === $repositoryCache || empty($repositoryCache)) {
            $repositoryCache = $this->getCachePath() . 'repos.json';
        }

        // $this->register(new GitServiceProvider(), array(
        //     'git.client'      => $config->get('git', 'client'),
        //     'git.repos'       => $repositories,
        //     'cache.repos'     => $repositoryCache,
        //     'ini.file'        => "config.ini",
        //     'git.hidden'      => $config->get('git', 'hidden') ?
        //                          $config->get('git', 'hidden') : array(),
        //     'git.default_branch' => $config->get('git', 'default_branch') ? $config->get('git', 'default_branch') : 'master',
        // ));

        $this->register(new ModelServiceProvider());
        $this->register(new UrlGeneratorServiceProvider());

        $this['twig'] = $this->share($this->extend('twig', function ($twig, $app) {
            $twig->addFilter('htmlentities', new \Twig_Filter_Function('htmlentities'));
            $twig->addFilter('md5', new \Twig_Filter_Function('md5'));

            return $twig;
        }));

        // Handle errors
        $this->error(function (\Exception $e, $code) use ($app) {
            if ($app['debug']) {
                return;
            }

            return $app['twig']->render('error.twig', array(
                'message' => $e->getMessage(),
            ));
        });
    }

    public function getPath()
    {
        return $this->path . DIRECTORY_SEPARATOR;
    }

    public function setPath($path)
    {
        $this->path = $path;
        return $this;
    }

    public function getCachePath()
    {
        return $this->path . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR;
    }

    public function getViewPath()
    {
        return $this->path . DIRECTORY_SEPARATOR . 'views' . DIRECTORY_SEPARATOR;
    }

    public function enableLogging($value)
    {
        $this->logging = $value;

        if ($this->logging) {
            $this->loggingFp = fopen($this->getPath() . 'cache/translator.log', 'a+');
        }
    }

    public function log($str)
    {
        if (! $this->logging) {
            return false;
        }

        if (! is_string($str)) {
            ob_start();
            print_r($str);
            $str = ob_get_contents();
            ob_end_clean();
        }

        $line = $str . PHP_EOL;
        $line .= '..................................................................................' . PHP_EOL;

        fwrite($this->loggingFp,  $line);
    }
}

