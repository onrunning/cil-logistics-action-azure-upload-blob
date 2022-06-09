# Azure blob upload

This action upload files to the Azure blob storage. If the files are
already existing, they will be overwritten.

## Example

Place the code in a 'xyz.yml' file in your '.github/workflows' folder.

    name: Upload Files To Azure Blob Storage
    on:
      push:
        branches:
          - main
    jobs:
      upload:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3                            
          - uses: onrunning/cil-logistics-action-azure-upload-blob@main
            with:
              source_dir: data                                   
              container_name: myContainer                        
              connection_string: ${{ secrets.ConnectionString }} 
              file_pattern: '*.xml'                              
              lease: -1                                          

-   To make this action work, it needs some data.

-   The local directory where to get the files from.

-   The name of the container in the Azure blob storage.

-   The Azure connection String for the blob storage.

-   The globby pattern to filter the files in the given directory.

-   If set, a lease will be created with the given Time. Must be between
    15 to 60 seconds, or infinite (-1)
