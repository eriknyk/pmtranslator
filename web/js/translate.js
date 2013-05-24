// translate.js


Ext.onReady(main);

var w;
var grid;
var store;

var screenWidth = Ext.getBody().getViewSize().width - 50;
var pageSize = 25;

// var project;  //is inherithed from main.php
var defaultProject = project ? project.PROJECT_NAME : '';
var uploadType;

function main()
{
    Ext.QuickTips.init();
    //Ext.state.Manager.setProvider(new Ext.state.CookieProvider());

    /*store = new Ext.data.GroupingStore( {
        autoLoad: true,
        proxy : new Ext.data.HttpProxy({
            url: 'main/dataView'
        }),
        reader : new Ext.data.JsonReader({
            totalProperty: 'totalCount',
            root: 'data',
            fields : [
                {name : 'MSG_STR'},
                {name : 'TRANSLATED_MSG_STR'}
            ]
        })
    });*/


    // Create a standard HttpProxy instance.
    var proxy = new Ext.data.HttpProxy({
        url: 'proxy/data'
    });

    // Typical JsonReader.  Notice additional meta-data params for defining the core attributes of your json-response
    var reader = new Ext.data.JsonReader({
        totalProperty: 'totalCount',
        successProperty: 'success',
        idProperty: 'id',
        root: 'data',
        messageProperty: 'message'  // <-- New "messageProperty" meta-data
    }, [
        {name: 'ID'},
        {name : 'MSG_STR'},
        {name : 'TRANSLATED_MSG_STR'}
    ]);

    // The new DataWriter component.
    var writer = new Ext.data.JsonWriter({
        encode: false   // <-- don't return encoded JSON -- causes Ext.Ajax#request to send data using jsonData config rather than HTTP params
    });

    // Typical Store collecting the Proxy, Reader and Writer together.
    var store = new Ext.data.GroupingStore({
        //id: 'user',
        autoLoad: true,
        restful: true,     // <-- This Store is RESTful
        proxy: proxy,
        reader: reader,
        writer: writer    // <-- plug a DataWriter into the store just as you would a Reader
    });
    ////////////
    store.setBaseParam('project', defaultProject);

    //
    // Listen to all DataProxy beforewrite events
    //
    Ext.data.DataProxy.addListener('beforewrite', function(proxy, action) {
        //alert("Before " + action);
        var sb = Ext.getCmp('basic-statusbar');
        sb.showBusy();
    });

    ////
    // all write events
    //
    Ext.data.DataProxy.addListener('write', function(proxy, action, result, res, rs) {
        //alert(action + ':' + res.message);
        var sb = Ext.getCmp('basic-statusbar');
        sb.setStatus({
            text: res.message, //action + ':' + res.message,
            iconCls: 'x-status-valid',
            clear: true // auto-clear after a set interval
        });

    });

    ////
    // all exception events
    //
    Ext.data.DataProxy.addListener('exception', function(proxy, type, action, options, res) {
        //alert("Something bad happend while executing " + action);
        var sb = Ext.getCmp('basic-statusbar');
        sb.setStatus({
            text: "Something bad happend while executing " + action,
            iconCls: 'x-status-error',
            clear: false
        });
    });


    var editor = new Ext.ux.grid.RowEditor({
        saveText: 'Update'
    });

    ////////// pagging bar

    var storePageSize = storePageSize = new Ext.data.SimpleStore({
        fields: ['size'],
        data: [['25'],['30'],['40'],['50'],['100']],
        autoLoad: true
    });

    var comboPageSize = new Ext.form.ComboBox({
        id: 'pageSize',
        typeAhead     : false,
        mode          : 'local',
        triggerAction : 'all',
        store: storePageSize,
        valueField: 'size',
        displayField: 'size',
        width: 50,
        editable: false,
        listeners:{
            select: function(c,d,i){
                //UpdatePageConfig(d.data['size']);
                bbar.pageSize = parseInt(d.data['size']);
                bbar.moveFirst();
            }
        }
    });

    comboPageSize.setValue(pageSize);

    var bbar = new Ext.PagingToolbar({
        pageSize: pageSize,
        store: store,
        displayInfo: true,
        displayMsg: 'Mostrando {0}-{1} de {2} registros' + '&nbsp; &nbsp; ',
        emptyMsg: 'Sin registros para mostrar',
        items: ['-',' Registros por pagina '+':',comboPageSize]
    });
    //////////


    var comboLanguage = new Ext.form.ComboBox({
        id: 'Language',
        fieldLabel: 'Language',
        typeAhead     : true,
        mode          : 'local',
        selectOnFocus : true,
        autocomplete  : true,
        triggerAction : 'all',
        store : new Ext.data.Store( {
            autoLoad: true,
            proxy : new Ext.data.HttpProxy( {
                url : 'proxy/getLanguages',
                method : 'GEt'
            }),
            //baseParams : {request : 'getLangList'},
            reader : new Ext.data.JsonReader( {
                fields : [ {name : 'LAN_NAME'}, {name : 'LAN_NAME'} ]
            }),
            listeners: {
                load: function() {
                    if (cookie.read('Pm-Translation-Tool-X-Language'))
                        comboLanguage.setValue(cookie.read('Pm-Translation-Tool-X-Language'));
                }
            }
        }),
        valueField: 'LAN_NAME',
        displayField: 'LAN_NAME',
        width: 50,
        editable: true,
        forceSelection: true,
        stateful: true,
        stateId: 'language_state_manager',
        listeners:{
            select: function(c,d,i){
                cookie.create('Pm-Translation-Tool-X-Language', this.getValue(), 365);
            }
        }
    });


    var comboCountry = new Ext.form.ComboBox({
        id: 'Country',
        fieldLabel: 'Country',
        typeAhead     : true,
        mode          : 'local',
        selectOnFocus  : true,
        autocomplete: true,
        triggerAction : 'all',
        store : new Ext.data.Store( {
            autoLoad: true,
            proxy : new Ext.data.HttpProxy( {
                url : 'proxy/getCountries',
                method : 'GET'
            }),
            //baseParams : {request : 'getLangList'},
            reader : new Ext.data.JsonReader( {
                fields : [ {name : 'IC_NAME'}, {name : 'IC_NAME'} ]
            }),
            listeners: {
                load: function() {
                    if (cookie.read('Pm-Translation-Tool-X-Country'))
                        comboCountry.setValue(cookie.read('Pm-Translation-Tool-X-Country'));
                }
            }
        }),
        valueField: 'IC_NAME',
        displayField: 'IC_NAME',
        width: 50,
        editable: true,
        forceSelection: true,
        //stateful: true,
        //stateId: 'country_state_manager',
        listeners:{
            select: function(c,d,i){
                cookie.create('Pm-Translation-Tool-X-Country', this.getValue(), 365);
            }
        }
    });

    //
    // toolbar options
    //


    var newProjectWindow = new Ext.Window({
        id: 'newProjectWindow',
        title: '&nbsp;',
        width: 420,
        height: 276,
        modal: true,
        autoScroll: true,
        maximizable: false,
        resizable: false,
        closeAction : 'hide',
        items: [
          new Ext.FormPanel({
            id:'uploader',
            fileUpload: true,
            width: 400,
            //height: 250,
            frame: true,
            //title: 'Upload File',
            //autoHeight: false,
            //bodyStyle: 'padding: 10px 10px 0 10px;',
            labelAlign: 'right',
            labelWidth: 100,
            items: [
                new Ext.form.FieldSet({
                    title: 'Project Details',
                    defaults: {
                        anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side'
                    },
                    items: [
                        {
                            id: 'project',
                            name: 'project',
                            xtype: 'textfield',
                            fieldLabel: 'Project Name',
                            allowBlank: false
                        },
                        {
                            xtype: 'fileuploadfield',
                            id: 'form-file',
                            emptyText: 'Select a .po file',
                            fieldLabel: 'File',
                            name: 'po_file',
                            buttonText: '',
                            buttonCfg: {
                                icon: 'web/img/folder_open.png',
                            }
                        }
                    ]
                }),
                new Ext.form.FieldSet({
                    id: '&nbsp;',
                    title: 'Project Translation Details',
                    defaults: {
                        anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side'
                    },
                    items: [
                        comboCountry,
                        comboLanguage
                    ]
                })
            ],
            buttons: [
                {
                    text: 'Upload',
                    handler: function() {
                        var uploader = Ext.getCmp('uploader');

                        if (uploader.getForm().isValid()) {
                            uploader.getForm().submit({
                                url: 'task/upload?type=source&project='+defaultProject,
                                waitTitle:'',
                                waitMsg: 'Uploading...',
                                success: function(o, resp) {
                                    location.href = base_url + 'translate?project=' + Ext.getCmp('project').getValue();
                                },
                                failure: function(o, resp){
                                    newProjectWindow.hide();
                                    Ext.MessageBox.show({title: '', msg: resp.result.message, buttons:Ext.MessageBox.OK, animEl: 'mb9', fn: function(){}, icon:Ext.MessageBox.ERROR});
                                }
                            });
                        }
                    }
                },
                {
                    text: 'Cancel',
                    handler: function(){
                        newProjectWindow.hide();
                    }
                }
            ]
          })
        ]
    });

    var newAction = new Ext.Action({
        text: 'New Project',
        icon: 'web/img/circle_plus.png',
        handler: function(){
            newProjectWindow.show();
        }
    });

    w = new Ext.Window({
        id: 'uploadWindow2',
        title: '',
        width: 420,
        height: 140,
        modal: true,
        autoScroll: false,
        maximizable: false,
        resizable: false,
        closeAction : 'hide',
        items: [
          new Ext.FormPanel({
            id:'uploader2',
            fileUpload: true,
            width: 400,
            frame: true,
            title: 'Upload File',
            autoHeight: false,
            bodyStyle: 'padding: 10px 10px 0 10px;',
            labelWidth: 50,
            defaults: {
                anchor: '90%',
                allowBlank: false,
                msgTarget: 'side'
            },
            items: [{
                xtype: 'fileuploadfield',
                id: 'form-file2',
                emptyText: 'Select a .po file',
                fieldLabel: 'File',
                name: 'po_file',
                buttonText: '',
                buttonCfg: {
                    icon: 'web/img/folder_open.png',
                }
            }],
            buttons: [{
                    text: 'Upload',
                    handler: function() {
                        var uploader = Ext.getCmp('uploader2');

                        if (uploader.getForm().isValid()) {
                            uploader.getForm().submit({
                                //url: 'http://local/translator/main/upload?type='+uploadType+'&project='+defaultProject,
                                url: 'task/upload?type='+uploadType+'&project='+defaultProject,
                                waitTitle:'',
                                waitMsg: 'Uploading...',
                                success: function(o, resp) {
                                    w.hide();
                                    grid.store.reload();

                                    Ext.MessageBox.show({
                                        width: 350,
                                        height: 500,
                                        msg: htmlentities_decode(resp.result.message),
                                        buttons: Ext.MessageBox.OK,
                                        icon: Ext.MessageBox.INFO
                                    });
                                },
                                failure: function(o, resp){
                                    //alert(resp);
                                    console.log(resp);
                                    w.hide();
                                    Ext.MessageBox.show({title: '', msg: htmlentities_decode(resp.result.message), buttons: Ext.MessageBox.OK, animEl: 'mb9', fn: function(){}, icon: Ext.MessageBox.ERROR});
                                }
                            });
                        }
                    }
                }, {
                    text: 'Cancel',
                    handler: function(){
                        w.hide();
                    }
                }
            ]
          })
        ]
    });

    var untranslatedFilter = new Ext.Button({
        id: 'untranslatedFilter',
        text: 'Untranslated',
        icon: 'web/img/lines.png',
        enableToggle: true,
        toggleHandler: onItemToggle,
        allowDepress: false,
        pressed: false
    });

    var allFilter = new Ext.Action({
        id: 'allFilter',
        text: 'All',
        icon: 'web/img/show_lines.png',
        enableToggle: true,
        toggleHandler: onItemToggle,
        allowDepress: false,
        pressed: true,
        handler: function (){}
    });

    function onItemToggle(item, pressed)
    {
        switch ( item.id ) {
            case 'untranslatedFilter' :
                Ext.getCmp('allFilter').toggle( false, true);
                store.setBaseParam('untranslatedFilter', '1');
                store.load({params:{untranslatedFilter: '1', start: 0 , limit: Ext.getCmp('pageSize').getValue(), project: defaultProject}});
                break;

            case 'allFilter' :
                store.setBaseParam('untranslatedFilter', '');
                Ext.getCmp('untranslatedFilter').toggle( false, true);
                store.load({params:{untranslatedFilter: '', start: 0 , limit: Ext.getCmp('pageSize').getValue(), project: defaultProject}});
                break;
        }
    }

    var uploadSource = new Ext.Action({
        text: 'Update Project',
        icon: 'web/img/edit.png',
        handler: function(){
            Ext.getCmp('uploadWindow2').setTitle('Update Project from a .po file');
            uploadType = 'source';
            w.show();
        }
    });

    var uploadTarget = new Ext.Action({
        text: 'Update Translations',
        iconCls: 'silk-add',
        icon: 'web/img/download.png',
        handler: function(){
            Ext.getCmp('uploadWindow2').setTitle('Update translations from a .po file');
            uploadType = 'target';
            w.show();
        }
    });

    var exportTarget = new Ext.Action({
        text: 'Export Translations',
        iconCls: 'silk-add',
        icon: 'web/img/upload.png',
        handler: function(){
            //exportWindow.show();
            var url = 'task/export?project='+defaultProject+'&country='+Ext.getCmp('Country').getValue()+'&language='+Ext.getCmp('Language').getValue();
            location.href = url;
        }
    });

    var searchTxt = new Ext.form.TextField ({
        text: 'Seach',
        emptyText: 'Enter a search term',
        id: 'searchTxt',
        //ctCls:'pm_search_text_field',
        allowBlank: true,
        width: 150,
        listeners: {
            specialkey: function(f, e){
                if (e.getKey() == e.ENTER) {
                    doSearch();
                }
            }
        }
    });

    function doSearch()
    {
        var searchTerm = Ext.getCmp('searchTxt').getValue();
        store.load({params:{searchTerm: searchTerm, start: 0 , limit: Ext.getCmp('pageSize').getValue(), project: defaultProject}});
    }


    function doClear()
    {
        Ext.getCmp('searchTxt').setValue('');
        store.load({params:{searchTerm: '', start: 0 , limit: Ext.getCmp('pageSize').getValue(), project: defaultProject}});
    }

    var gridToolbar = new Array(
        '&nbsp;&nbsp;',
        allFilter,
        untranslatedFilter,
        '-', '-'
    );

    if (options.update_translations)
        gridToolbar.push(uploadTarget);

    if (options.export_translations)
        gridToolbar.push(exportTarget);

    gridToolbar.push('->');
    gridToolbar.push(searchTxt);
    gridToolbar.push({
        text: 'X',
        handler: doClear
    });
    gridToolbar.push({
        text: 'Search',
        handler: doSearch
    });

    gridToolbar.push();

    grid = new Ext.grid.GridPanel({
        title: '&nbsp;',
        store: store,
        width: 600,
        region:'center',
        margins: '0 5 5 5',
        //autoExpandColumn: 'name',
        plugins: [editor],
        view: new Ext.grid.GroupingView({
            markDirty: false
        }),
        tbar: gridToolbar,

        columns: [
        //new Ext.grid.RowNumberer(),
        {
            id: 'ID',
            dataIndex: 'ID',
            //header: '#',
            hidden: true,
            //width: '40px',
            sortable: false,
            menuDisabled: true
        },
        {
            id: 'MSG_STR',
            header: 'Source String ('+project.LANGUAGE+')',
            dataIndex: 'MSG_STR',
            width: screenWidth/2,
            sortable: true,
            renderer: function(val) {
                return ' '+val; //return '<pre>' + val + '</pre>';
            }
        },{
            id: 'TRANSLATED_MSG_STR',
            header: 'Translated String ('+project.TARGET_LANGUAGE+')',
            dataIndex: 'TRANSLATED_MSG_STR',
            width : screenWidth/2,
            sortable: true,
            editor: {
                xtype: 'textarea',
                allowBlank: true
            }
        }],
        bbar: bbar,

        listeners: {
            render: function(){
                this.loadMask = new Ext.LoadMask(this.body, {msg:'Loading...'});
                grid.getSelectionModel().on('rowselect', function(){
                    var rowSelected = grid.getSelectionModel().getSelected();
                    if (window.console)
                        console.log(rowSelected.data);
                });
            }
        }
    });

    var projectsCombo = new Ext.form.ComboBox({
        id: 'projects',
        //typeAhead     : false,
        //mode          : 'local',
        //triggerAction : 'all',
        // store: new Ext.data.SimpleStore({
        //     fields: ['size'],
        //     data: projects,
        //     autoLoad: true,
        //     listeners: {
        //         load: function() {
        //             console.log(this);
        //             // i = cmbDateFormat.store.findExact('id', default_date_format, 0);
        //             // cmbDateFormat.setValue(cmbDateFormat.store.getAt(i).data.id);
        //             // cmbDateFormat.setRawValue(cmbDateFormat.store.getAt(i).data.name);
        //         }
        //     }
        // }),
        typeAhead     : true,
        mode          : 'local',
        selectOnFocus : true,
        autocomplete  : true,
        triggerAction : 'all',
        store : new Ext.data.Store( {
            autoLoad: true,
            proxy : new Ext.data.HttpProxy( {
                url : 'proxy/getProjects',
                method : 'GET'
            }),
            //baseParams : {request : 'getLangList'},
            reader : new Ext.data.JsonReader( {
                fields : [ {name : 'ID'}, {name : 'NAME'} ]
            }),
            listeners: {
                load: function() {
                    i = projectsCombo.store.findExact('ID', project.PROJECT_ID, 0);
                    projectsCombo.setValue(projectsCombo.store.getAt(i).data.ID);
                    projectsCombo.setRawValue(projectsCombo.store.getAt(i).data.NAME);
                }
            }
        }),
        valueField: 'ID',
        displayField: 'NAME',
        width: 250,
        editable: true,
        listeners:{
            select: function(c,d,i){
                selectProject();
            }
        }
    });

    //projectsCombo.setValue ( defaultProject);

    Ext.ns('App');

    App.BookDetail = Ext.extend(Ext.Panel, {
        // add tplMarkup as a new property
        tplMarkup: [
            '<table class="datails" border=0>',
            '<tr><td class="label">Project:</td><td>{PROJECT_NAME}</td>',
            '<td class="label">Source Country:</td><td> {COUNTRY}</td>',
            '<td class="label">Target Country:</td><td> {TARGET_COUNTRY}</td></tr>',
            '<tr><td class="label">Created Since:</td><td>{CREATE_DATE}</td>',
            '<td class="label">Source Language:</td><td> {LANGUAGE}</td>',
            '<td class="label">Target Language:</td><td> {TARGET_LANGUAGE}</td></tr>',
            '<tr><td class="label">Last Update:</td><td>{UPDATE_DATE}</td>',
            '<td class="label">Source Locale:</td><td>{LOCALE}</td>',
            '<td class="label">Target Locale:</td><td>{TARGET_LOCALE}</td></tr>',
            '<tr><td class="label">Records Count:</td><td> {NUM_RECORDS}</td></tr></table>'
        ],
        // startingMarup as a new property
        startingMarkup: 'No project found, to create a new project click on [New Project] button.',
        // override initComponent to create and compile the template
        // apply styles to the body of the panel and initialize
        // html to startingMarkup
        initComponent: function() {
            this.tpl = new Ext.Template(this.tplMarkup);
            Ext.apply(this, {
                bodyStyle: {
                    background: '#ffffff',
                    padding: '7px'
                },
                html: this.startingMarkup
            });
            // call the superclass's initComponent implementation
            App.BookDetail.superclass.initComponent.call(this);
        },
        // add a method which updates the details
        updateDetail: function(data) {
            this.tpl.overwrite(this.body, data);
        }
    });
    // register the App.BookDetail class with an xtype of bookdetail
    Ext.reg('bookdetail', App.BookDetail);

    var northPanelHeight = 140;

    if (! defaultProject) {
        northPanelHeight = 100;
    }

    var detailPanelToolbar = new Array('&nbsp;&nbsp;Project: ', projectsCombo);

    if (options.new_project)
        detailPanelToolbar.push(newAction);

    if (options.update_project)
        detailPanelToolbar.push(uploadSource);

    viewport = new Ext.Viewport({
        layout: 'border',
        autoScroll: false,
        items: [
            {
                layout: 'fit',
                xtype: 'panel',
                region: 'center', // a center region is ALWAYS required for border layout
                //deferredRender: false,
                items: [grid],
                bbar:  new Ext.ux.StatusBar({
                    id: 'basic-statusbar',
                    defaultText: '&nbsp;',
                    //defaultIconCls: 'default-icon',
                    autoClear: 5000,
                    //text: 'Ready',
                    //iconCls: 'x-status-valid',
                    statusAlign: 'right', // the magic config
                    items: []
                })
            },
            {
                //layout: 'fit',
                xtype: 'bookdetail',
                id: 'detailPanel',
                region: 'north',
                height: northPanelHeight,
                title: "Translator Tool",
                //items: northPanelItems,
                tbar: detailPanelToolbar
            }
        ]
    });

    var detailPanel = Ext.getCmp('detailPanel');

    if (defaultProject)
        detailPanel.updateDetail(project);
}


function uploadFile(type, reload)
{
    var uploader = Ext.getCmp('uploader');
    type = type || uploadType; // <-- this var 'uploadType' comes from a global declared variable
    reload = reload || false;

    if (uploader.getForm().isValid()) {
        uploader.getForm().submit({
            url: 'task/upload?type=' + type+'&project='+defaultProject,
            waitTitle:'',
            waitMsg: 'Uploading...',
            success: function(o, resp){
                if (typeof reload != 'undefined' && reload) {
                    var projectName = Ext.getCmp('project').getValue();
                    location.href = base_url + '?project=' + projectName;
                } else {
                    w.close();
                    grid.store.reload();

                    Ext.MessageBox.show({
                        width: 500,
                        height: 500,
                        msg: "<pre style='font-size:10px'>"+resp.result.message+"</pre>",
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.INFO
                    });
                }
            },
            failure: function(o, resp){
              w.close();
              Ext.MessageBox.show({title: '', msg: resp.result.msg, buttons:
              Ext.MessageBox.OK, animEl: 'mb9', fn: function(){}, icon:
              Ext.MessageBox.ERROR});
              //setTimeout(function(){Ext.MessageBox.hide(); }, 2000);
            }
        });
    }
}

function selectProject()
{
    location.href = base_url + '?id=' + Ext.getCmp('projects').getValue();

    return;
    store.setBaseParam('project', project);

    store.load({params:{project: project, start: 0 , limit: pageSize}});

    defaultProject = project;
}

var cookie = {
    create: function(name, value, days) {
      if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
      }else var expires = "";
        document.cookie = name+"="+value+expires+"; path=/";
    },

    read: function(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    },

    erase: function(name) {
      Tools.createCookie(name,"",-1);
    }
}


function htmlentities(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function htmlentities_decode(str) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'');
}

