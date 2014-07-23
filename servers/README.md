Research Services
========
This is the GlassLab Research Services (Parsing Tool).
It is a nodeJS web server. nodeJS servers is used for producing REST endpoints. Angular is used for frontend rendering and navigation.

Dependencies
------------
1. **Node.js**
2. **Forever** process manager
    * Use NPM to install forever process manager globally
    ```sh
    $ sudo npm install forever -g
    ```
3. **Bower** package manager
    * Use NPM to install bower package manager globally
    ```sh
    $ sudo npm install bower -g
    ```
4. Connection to the **Couchbase** server where all the data lives


OSX Installation
------------
1. Install **Brew**
   * http://brew.sh/
    ```sh
    $ ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"
    ```
2. Install **Node.js**
   * Use Brew to install node
   ```sh
   $ brew install node
   ```
3. Install **Forever** node process manager
  * Use NPM to install forever process manager globally
  ```sh
  $ sudo npm install forever -g
  ```
4. **Bower** package manager
    * Use NPM to install bower package manager globally
    ```sh
    $ sudo npm install bower -g
    ```


Running the app
---------------
1. Start/Stop/Restart servies
  * To start services run the following command:
  ```sh
  $ ./service.sh start
  ```
  * To stop services run the following command:
  ```sh
  $ ./service.sh stop
  ```
  * To restart services run the following command:
  ```sh
  $ ./service.sh restart
  ```
2. In a browser go to [http://localhost:8090](http://localhost:8090)
