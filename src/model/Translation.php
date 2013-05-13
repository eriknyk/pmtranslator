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

    public function select($record = array())
    {
        $from = array();
        $where = array();

        foreach ($record as $key => $value) {
            $from[] = $key;
            $where[] = $key . '=' . $this->dbh->quote($value);
        }

        $from = (count($from) > 0) ? implode(',', $from) : '*';

        $sql = "SELECT ".$from." FROM " . $this->tableTarget;

        if (! empty($record)) {
            $sql .= " WHERE ".implode(',', $where);
        }

        try {
            $rows = $this->dbh->query($sql)->fetchall();
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

        $sql = "UPDATE ".$this->tableTarget." SET ".implode(',', $keys)." WHERE ".implode(',', $where).";";

        try {
            $this->dbh->exec($sql);
        } catch (PDOException $e) {
            echo 'Query Error: ' . $e->getMessage();
        }
    }

    public function query($sql)
    {
        return $this->dbh->query($sql);
    }

    public function setTarget($tableName)
    {
        $this->tableTarget = $tableName;
    }

    public function projectExists($projName)
    {
        $this->setTarget('PROJECT');
        return $this->select(array('PROJECT_NAME' => $projName)) ? true : false;
    }

    public function createProject($projName)
    {
        $projName = strtoupper($projName);
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
        return $this->dbh->exec($sql);
    }
}
