<?php

namespace PmTranslator\Provider;

use PmTranslator\Model\Model;
use Silex\Application;
use Silex\ServiceProviderInterface;

class ModelServiceProvider implements ServiceProviderInterface
{

    /**
     * Register the Model/Model on the Application ServiceProvider
     *
     * @param  Application $app Silex Application
     * @return Git\Client  Instance of the Git\Client
     */
    public function register(Application $app)
    {
        $app['model'] = function () use ($app) {
            $config = $app['database'];

            return new Model($config);
        };
    }

    public function boot(Application $app)
    {
    }
}

