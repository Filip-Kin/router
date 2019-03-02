# Router
Handles all requests from visitors to client services, and clients to our services. Also runs the API.

## Dev Enviorment
Detailed instructions on how to setup development enviroment
All instructions assume you're using linux

### [Google Cloud SDK](https://cloud.google.com/sdk/docs/downloads-apt-get)
1. Create an environment variable for the correct distribution
`export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"`
2. Add the Cloud SDK distribution URI as a package source
`echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`
**Note:** If you have apt-transport-https installed, you can use "https" instead of "http" in this step.
3. Import the Google Cloud public key
`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -`
**Troubleshooting Tip:** If you are unable to get latest updates due to an expired key, obtain the latest apt-get.gpg key file.
4. Update and install the Cloud SDK
`sudo apt-get update && sudo apt-get install google-cloud-sdk`
**Note:** For additional apt-get options, such as disabling prompts or dry runs, refer to the apt-get man pages.
5. Run gcloud init to authenticate and select the project
`gcloud init`

### Database Proxy
1. Download the [Google Cloud Proxy](https://cloud.google.com/sql/docs/mysql/sql-proxy#install)
2. Bind the SQL instance to a port
`./cloud_sql_proxy --instances=kiwahosting-2:us-east1:kiwahosting=tcp:3306`
3. Update port in `config.json` *(default is 3306)*