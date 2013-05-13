<html>
<head>
    <!-- ** CSS ** -->
    <!-- base library -->
    <link rel="stylesheet" type="text/css" href="public/extjs/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/extjs/resources/css/xtheme-gray.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/ext-gray-extend.css" />
    <link rel="stylesheet" type="text/css" title="gray" href="public/rowEditor.css" />

    <style type="text/css">

    </style>

    <!-- ** Javascript ** -->
    <!-- ExtJS library: base/adapter -->
    <script type="text/javascript" src="public/extjs/adapter/ext/ext-base.js"></script>

    <!-- ExtJS library: all widgets -->
    <script type="text/javascript" src="public/extjs/ext-all.js"></script>
    <script type="text/javascript" src="public/ux-all.js"></script>

    <script type="text/javascript" src="js/main.js"></script>

    <script>
        var projects = <?php echo json_encode($projects)?>;
        var defaultProject = '<?php echo $defaultProject ?>';
    </script>
</head>
<body>

    <div id="editor-grid"></div>
</body>
</html>
