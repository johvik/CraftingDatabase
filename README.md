# CraftingDatabase
[![Build Status](https://travis-ci.org/johvik/CraftingDatabase.svg?branch=master)](https://travis-ci.org/johvik/CraftingDatabase)

## Installation
```sh
# Create a customized .env
docker-compose up -d
# Add a realm
docker-compose exec db mysql --user=cdb --password=craftingdatabase cdb
# e.g: INSERT INTO realm (region, name) VALUES ("eu", "draenor");
```
