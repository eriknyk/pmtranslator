
Ext.onReady(main);

var w;
var grid;
var store;

var screenWidth = Ext.getBody().getViewSize().width - 50;
var pageSize = 25;

function main()
{
    Ext.QuickTips.init();

    store = new Ext.data.GroupingStore( {
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
    });
    store.setBaseParam('project', defaultProject);

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
        iconCls: 'silk-add',
        icon: 'public/images/import.gif',
        handler: function(){
            w = new Ext.Window({
            title: '',
            width: 420,
            height: 170,
            modal: true,
            autoScroll: false,
            maximizable: false,
            resizable: false,
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
                        xtype: 'textfield',
                        fieldLabel: 'Project Name',
                        name: 'project',
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
                            icon: 'public/images/folder.gif',
                        }
                    }
                ],
                buttons: [
                  {
                    text: 'Upload',
                    handler: function(){
                      uploadFile('source', true)
                    }
                  },
                  {
                    text: 'Cancel',
                    handler: function(){
                      w.close();
                    }
                  }
                ]
              })
            ]
          });
          w.show();
        }
    });

    var uploadSource = new Ext.Action({
        text: 'Upload Source (en)',
        iconCls: 'silk-add',
        icon: 'public/images/import.gif',
        handler: function(){
            w = new Ext.Window({
            title: '',
            width: 420,
            height: 140,
            modal: true,
            autoScroll: false,
            maximizable: false,
            resizable: false,
            items: [
              new Ext.FormPanel({
                id:'uploader',
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
                    id: 'form-file',
                    emptyText: 'Select a .po file',
                    fieldLabel: 'File',
                    name: 'po_file',
                    buttonText: '',
                    buttonCfg: {
                        icon: 'public/images/folder.gif',
                    }
                }],
                buttons: [
                  {
                    text: 'Upload',
                    handler: function(){
                      uploadFile('source')
                    }
                  },
                  {
                    text: 'Cancel',
                    handler: function(){
                      w.close();
                    }
                  }
                ]
              })
            ]
          });
          w.show();
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
        tbar: [uploadSource],

        columns: [
        new Ext.grid.RowNumberer(),
        {
            id: 'MSG_STR',
            header: 'Source String',
            dataIndex: 'MSG_STR',
            width: screenWidth/2,
            sortable: true,
            renderer: function(val) {
                return '<pre>' + val + '</pre>';
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

    if (defaultProject != '') {
        projectsCombo.setValue(defaultProject);
    }

    viewport = new Ext.Viewport({
        layout: 'border',
        autoScroll: false,
        items: [
            {
                layout: 'fit',
                region: 'center', // a center region is ALWAYS required for border layout
                //deferredRender: false,
                items: [grid]
            },
            {
                layout: 'fit',
                xtype: 'panel',
                region: 'north',
                height:150,
                items: [
                new Ext.FormPanel({
                    title: 'Translator tool',
                    labelWidth: 75, // label settings here cascade unless overridden
                    frame:true,

                    bodyStyle:'padding:5px 5px 0',
                    width: 350,
                    labelWidth: 200,
                    defaults: {width: 230},
                    defaultType: 'textfield',
                    labelAlign: 'right',

                    items: [
                        /*{
                            xtype: 'displayfield',
                            fieldLabel: 'Source Language',
                            value: info.source_language
                        },{
                            fieldLabel: 'Records Count',
                            value: info.records_count
                        },{
                            fieldLabel: 'Source Last Update Date' ,
                            value: info.source_last_update
                        }*/
                    ]
                })
                ],
                tbar: [
                    '&nbsp;&nbsp;Project: ',
                    projectsCombo,
                    newAction
                ]
            }
        ]
    });
}


function uploadFile(type, reload)
{
    var uploader = Ext.getCmp('uploader');

    if (uploader.getForm().isValid()) {
        uploader.getForm().submit({
            url: 'main/upload?type=' + type+'&project='+defaultProject,
            waitTitle:'',
            waitMsg: 'Uploading...',
            success: function(o, resp){
                if (typeof reload != 'undefined' && reload) {
                    location.href = location.href;
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
              //alert('ERROR "'+resp.result.msg+'"');
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
    store.setBaseParam('project', project);

    store.load({params:{project: project, start: 0 , limit: pageSize}});

    defaultProject = project;
}
