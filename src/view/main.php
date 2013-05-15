<html>
<head>
    <!-- ** CSS ** -->
    <!-- base library -->
    <link rel="stylesheet" type="text/css" href="public/extjs/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/extjs/resources/css/xtheme-gray.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/ext-gray-extend.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/rowEditor.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/statusbar.css" />


    <style type="text/css">
    table.datails {
        font-family: Helvetica, Arial;
        border: 0;
    }

    table.datails td{
        font-family: Helvetica, Arial;
        font-size: 12px;
    }

    .label{
        width:150px;
        align:right;
        font-weight: bold;
        text-align: right;
    }
    </style>

    <!-- ** Javascript ** -->
    <!-- ExtJS library: base/adapter -->
    <script type="text/javascript" src="public/extjs/adapter/ext/ext-base.js"></script>

    <!-- ExtJS library: all widgets -->
    <script type="text/javascript" src="public/extjs/ext-all.js"></script>
    <script type="text/javascript" src="public/ux-all.js"></script>

    <script>
        var projects = <?php echo json_encode($projects)?>;
        var project = <?php echo json_encode($project)?>;
        var base_url = '<?php echo $config['base_url']?>'
    </script>

    <script type="text/javascript" src="js/main.js"></script>
</head>
<body>

    <div id="editor-grid"></div>
</body>
</html>
