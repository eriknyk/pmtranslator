
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
    Ext.state.Manager.setProvider(new Ext.state.CookieProvider());

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
        url: 'main/api'
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


    //
    // toolbar options
    //

    var newAction = new Ext.Action({
        text: 'New Project',
        //iconCls: 'silk-add',
        icon: 'public/images/circle_plus.png',
        handler: function(){
          var win = new Ext.Window({
            id: 'win',
            title: '',
            width: 420,
            height: 170,
            modal: true,
            autoScroll: false,
            maximizable: false,
            resizable: false,
            //closeAction : 'hide',
            items: [
              new Ext.FormPanel({
                id:'uploader',
                fileUpload: true,
                width: 400,
                frame: true,
                title: 'Upload File',
                autoHeight: false,
                bodyStyle: 'padding: 10px 10px 0 10px;',
                labelAlign: 'right',
                labelWidth: 100,
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
                            icon: 'public/images/folder_open.png',
                        }
                    }
                ],
                buttons: [
                    {
                        text: 'Upload',
                        handler: function() {
                            var uploader = Ext.getCmp('uploader');

                            if (uploader.getForm().isValid()) {
                                uploader.getForm().submit({
                                    url: 'main/upload?type=source&project='+defaultProject,
                                    waitTitle:'',
                                    waitMsg: 'Uploading...',
                                    success: function(o, resp){
                                        var projectName = Ext.getCmp('project').getValue();
                                        location.href = base_url + '?project=' + projectName;
                                    },
                                    failure: function(o, resp){
                                        win.close();
                                        Ext.MessageBox.show({title: '', msg: resp.result.msg, buttons:Ext.MessageBox.OK, animEl: 'mb9', fn: function(){}, icon:Ext.MessageBox.ERROR});
                                    }
                                });
                            }
                        }
                    },
                    {
                        text: 'Cancel',
                        handler: function(){
                            win.close();
                        }
                    }
                ]
              })
            ]
          });
          win.show();
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
                    icon: 'public/images/folder_open.png',
                }
            }],
            buttons: [{
                    text: 'Upload',
                    handler: function() {
                        var uploader = Ext.getCmp('uploader2');

                        if (uploader.getForm().isValid()) {
                            uploader.getForm().submit({
                                url: 'main/upload?type='+uploadType+'&project='+defaultProject,
                                waitTitle:'',
                                waitMsg: 'Uploading...',
                                success: function(o, resp){
                                    w.close();
                                    grid.store.reload();

                                    Ext.MessageBox.show({
                                        width: 500,
                                        height: 500,
                                        msg: "<pre style='font-size:10px'>"+resp.result.message+"</pre>",
                                        buttons: Ext.MessageBox.OK,
                                        icon: Ext.MessageBox.INFO
                                    });
                                },
                                failure: function(o, resp){
                                    w.close();
                                    Ext.MessageBox.show({title: '', msg: resp.result.msg, buttons: Ext.MessageBox.OK, animEl: 'mb9', fn: function(){}, icon: Ext.MessageBox.ERROR});
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

    var comboLanguage = new Ext.form.ComboBox({
        id: 'Language',
        fieldLabel: 'Language',
        typeAhead     : true,
        typeAhead     : true,
        mode          : 'local',
        selectOnFocus : true,
        autocomplete  : true,
        triggerAction : 'all',
        store : new Ext.data.Store( {
            autoLoad: true,
            proxy : new Ext.data.HttpProxy( {
                url : 'main/getLanguages',
                method : 'POST'
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
                url : 'main/getCountries',
                method : 'POST'
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

    var exportWindow = new Ext.Window({
        id: 'exportWindow',
        title: '',
        width: 420,
        height: 170,
        modal: true,
        autoScroll: false,
        maximizable: false,
        resizable: false,
        closeAction : 'hide',
        items: [
          new Ext.FormPanel({
            id:'formPanel1',
            fileUpload: true,
            width: 400,
            frame: true,
            title: 'Export Translation File',
            autoHeight: false,
            bodyStyle: 'padding: 10px 10px 0 10px;',
            labelWidth: 80,
            labelAlign: 'right',
            defaults: {
                anchor: '90%',
                allowBlank: false,
                msgTarget: 'side'
            },
            items: [
                comboCountry,
                comboLanguage
            ],
            buttons: [{
                    text: 'Export',
                    handler: function() {
                        var formPanel = Ext.getCmp('formPanel1');

                        if (formPanel.getForm().isValid()) {

                            var url = 'main/export?project='+defaultProject+'&country='+Ext.getCmp('Country').getValue()+'&language='+Ext.getCmp('Language').getValue();

                            location.href = url;
                        }
                    }
                }, {
                    text: 'Cancel',
                    handler: function(){
                        exportWindow.hide();
                    }
                }
            ]
          })
        ]
    });

    var uploadSource = new Ext.Action({
        text: 'Update Project',
        icon: 'public/images/edit.png',
        handler: function(){
            Ext.getCmp('uploadWindow2').setTitle('Update Project from a .po file');
            uploadType = 'source';
            w.show();
        }
    });

    var uploadTarget = new Ext.Action({
        text: 'Update Translations',
        iconCls: 'silk-add',
        icon: 'public/images/download.png',
        handler: function(){
            Ext.getCmp('uploadWindow2').setTitle('Update translations from a .po file');
            uploadType = 'target';
            w.show();
        }
    });

    var exportTarget = new Ext.Action({
        text: 'Export Translations',
        iconCls: 'silk-add',
        icon: 'public/images/upload.png',
        handler: function(){
            exportWindow.show();
        }
    });

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
        tbar: [uploadTarget, exportTarget],

        columns: [
        new Ext.grid.RowNumberer(),
        {
            id: 'ID',
            dataIndex: 'ID',
            hidden: true
        },
        {
            id: 'MSG_STR',
            header: 'Source String',
            dataIndex: 'MSG_STR',
            width: screenWidth/2,
            sortable: true,
            renderer: function(val) {
                return val; //return '<pre>' + val + '</pre>';
            }
        },{
            id: 'TRANSLATED_MSG_STR',
            header: 'Source String',
            dataIndex: 'TRANSLATED_MSG_STR',
            width : screenWidth/2,
            sortable: true,
            editor: {
                xtype: 'textarea',
                allowBlank: true
            }
        }],
        bbar: bbar
    });

    var projectsCombo = new Ext.form.ComboBox({
        id: 'projects',
        typeAhead     : false,
        mode          : 'local',
        triggerAction : 'all',
        store: new Ext.data.SimpleStore({
            fields: ['size'],
            data: projects,
            autoLoad: true
        }),
        valueField: 'size',
        displayField: 'size',
        width: 250,
        editable: false,
        listeners:{
            select: function(c,d,i){
                selectProject();
            }
        }
    });

    var projectDetailsForm = new Ext.FormPanel({
        //title: '&nbsp;',
        labelWidth: 75, // label settings here cascade unless overridden
        frame:true,

        bodyStyle:'padding:5px 5px 0',
        width: 700,
        labelWidth: 200,
        defaults: {width: 230},
        defaultType: 'textfield',
        labelAlign: 'right',

        items: [
            {
                xtype: 'compositefield',
                fieldLabel: 'Project',
                msgTarget : 'side',
                anchor    : '-20',
                defaults: { flex: 1 },
                items: [
                    {
                        xtype: 'displayfield',
                        value: (project.PROJECT_NAME ? project.PROJECT_NAME : '')
                    },
                    {
                       xtype: 'displayfield',
                       value: 'Created Since: ' + (project.CREATE_DATE ? project.CREATE_DATE : '')
                    }
                ]
            },{
                xtype: 'compositefield',
                fieldLabel: 'Language',
                msgTarget : 'side',
                anchor    : '-20',
                defaults: { flex: 1 },
                items: [
                    {
                        xtype: 'displayfield',
                        fieldLabel: 'Source Language',
                        value: (project.LOCALE ? project.COUNTRY + ' ' + project.LANGUAGE + ' ('+project.LOCALE+')' : '')
                    },
                    {
                       xtype: 'displayfield',
                       value: '&nbsp;&nbsp;&nbsp;Last Update: ' + (project.UPDATE_DATE ? project.UPDATE_DATE : '')
                    }
                ]
            },{
                xtype: 'displayfield',
                fieldLabel: 'Records Count',
                value: (project.NUM_RECORDS ? project.NUM_RECORDS : '')
            }
        ]
    });

    var northPanelItems = new Array();
    var northPanelHeight = 140;

    if (defaultProject) {
        projectsCombo.setValue(defaultProject);
        northPanelItems.push(projectDetailsForm);
    } else {
        northPanelHeight = 30;
    }

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
                xtype: 'panel',
                region: 'north',
                height: northPanelHeight,
                title: "Translator Tool",
                items: northPanelItems,
                tbar: [
                    '&nbsp;&nbsp;Project: ',
                    projectsCombo,
                    newAction,
                    uploadSource
                ]
            }
        ]
    });
}


function uploadFile(type, reload)
{
    var uploader = Ext.getCmp('uploader');
    type = type || uploadType; // <-- this var 'uploadType' comes from a global declared variable
    reload = reload || false;

    if (uploader.getForm().isValid()) {
        uploader.getForm().submit({
            url: 'main/upload?type=' + type+'&project='+defaultProject,
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
    var project = Ext.getCmp('projects').getValue();
    location.href = base_url + '?project=' + project;

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
