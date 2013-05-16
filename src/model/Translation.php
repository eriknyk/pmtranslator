<?php

class Translation
{
    protected $dbh;
    protected $config;
    protected $tableTarget;

    public function __construct()
    {
        $this->conf = parse_ini_file(HOME_DIR . '/config.ini');

        try {
            $this->dbh = new PDO($this->conf['dsn'], $this->conf['db_user'], $this->conf['db_password']);
        } catch (PDOException $e) {
            echo 'Connection Error: ' . $e->getMessage();
        }
    }

    public function select($select = '*', $where = array())
    {
        $whereList = array();

        if (! is_array($select)) {
            $select = array($select);
        }

        $sql = "SELECT ".implode(',', $select)." FROM " . $this->tableTarget;

        if (! empty($where)) {
            foreach ($where as $key => $value) {
                $whereList[] = $key . '=' . $this->dbh->quote($value);
            }

            $sql .= " WHERE ".implode(' AND ', $whereList);
        }

        try {
            error_log($sql);
            $rows = $this->dbh->query($sql);

            if (! $rows) {
                return false;
            }

            $records = array();
            foreach ($rows as $row) {
                $record = array();
                foreach ($row as $key => $value) {
                    if (! is_integer($key)) {
                        $record[$key] = $value;
                    }
                }
                $records[] = $record;
            }

            return $records;
        } catch (PDOException $e) {
            echo 'Query Error: ' . $e->getMessage();
        }
    }

    public function save($record)
    {
        $sql = "INSERT INTO " .  $this->tableTarget . " ";
        $keys = $values = array();

        foreach ($record as $key => $value) {
            $keys[] = $key;
            $values[] = $this->dbh->quote($value);
        }

        $sql .= "(".implode(',', $keys).") VALUES (".implode(',', $values).");";

        try {
            $this->dbh->exec($sql);
        } catch (PDOException $e) {
            echo 'Query Error: ' . $e->getMessage();
        }
    }

    public function update($record, $condition)
    {
        $set = $where = array();

        foreach ($record as $key => $value) {
            $set[] = $key . '=' . $this->dbh->quote($value);
        }

        foreach ($condition as $key => $value) {
            $where[] = $key . '=' . $this->dbh->quote($value);
        }

        $sql = "UPDATE ".$this->tableTarget." SET ".implode(',', $set)." WHERE ".implode(' AND ', $where).";";

        //error_log($sql);
        $this->dbh->exec($sql);
    }

    public function query($sql)
    {
        error_log($sql);
        return $this->dbh->query($sql);
    }

    public function setTarget($tableName)
    {
        $this->tableTarget = $tableName;
    }

    public function projectExists($projName)
    {
        $this->setTarget('PROJECT');
        return $this->select('*', array('PROJECT_NAME' => $projName)) ? true : false;
    }

    public function createProject($projName)
    {
        //$projName = strtoupper($projName);
        $sql = <<<EOL
CREATE TABLE IF NOT EXISTS `$projName` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `REF_1` varchar(128) COLLATE utf8_bin NOT NULL,
  `REF_2` varchar(128) COLLATE utf8_bin NOT NULL,
  `REF_LOC` varchar(128) COLLATE utf8_bin NOT NULL,
  `MSG_ID` text COLLATE utf8_bin NOT NULL,
  `MSG_STR` text COLLATE utf8_bin NOT NULL,
  `TRANSLATED_MSG_STR` text COLLATE utf8_bin NOT NULL,
  `SOURCE_LANG` varchar(5) COLLATE utf8_bin NOT NULL,
  `TARGET_LANG` varchar(5) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`ID`)
)
EOL;
        $this->setTarget('PROJECT');
        $this->save(array(
            'PROJECT_NAME' => $projName,
            'CREATE_DATE' => date('Y-m-d H:i:s')
        ));
        $this->dbh->exec($sql);

        $this->dbh->exec("CREATE INDEX REF_1_index USING BTREE ON $projName (REF_1);");
        $this->dbh->exec("CREATE INDEX REF_2_index USING BTREE ON $projName (REF_2);");
        $this->dbh->exec("CREATE INDEX REF_LOC_index USING BTREE ON $projName (REF_LOC);");
        $this->dbh->exec("CREATE INDEX MSG_ID_index USING BTREE ON $projName (MSG_ID);");
    }
}
