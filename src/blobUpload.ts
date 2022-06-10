import fs from 'fs'
import path from 'path'
import util from 'util'
import * as core from '@actions/core'
import { BlobServiceClient } from '@azure/storage-blob'
import globby from 'globby'

const readFile = util.promisify(fs.readFile)

export async function blobUpload() {
  try {
    console.log('Start uploading Blob Data')
    const { connectionString, containerName, sourceDir, filePattern, lease } =
      getInputData()

    const filesToUpload = await getFilesToUpload({ sourceDir, filePattern })

    if (filesToUpload.length > 0) {
      core.notice(`Upload the following files:\n${filesToUpload.join('\n')}`)

      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString)
      const containerClient =
        blobServiceClient.getContainerClient(containerName)

      for (const file of filesToUpload) {
        const blobName = path.relative(sourceDir, file)
        const content = await readFile(file, 'utf8')
        const blobClient = containerClient.getBlockBlobClient(blobName)
        const blobLeaseClient = blobClient.getBlobLeaseClient()

        if (await blobClient.exists()) {
          // In this case we need to break the lease
          try {
            await blobLeaseClient.breakLease(0)
          } catch (error) {
            console.log('------------------------------')
            console.log((error as Error).message)
            console.log('------------------------------')
            if (
              (error as Error).message !==
              'There is currently no lease on the blob.'
            ) {
              throw error
            }
          }
        }
        await blobClient.upload(content, content.length)
        if (lease !== undefined) {
          // If a lease was defined in the parameter, it will be set
          await blobLeaseClient.acquireLease(lease)
        }
      }

      core.notice(`Sucessfuly uploaded the files.`)
    } else {
      core.warning(`There are no files for upload.`)
    }
  } catch (error) {
    console.log(error)
    core.setFailed((error as Error).message)
    printHelp()
  }
}

/**
 * The request definition for getFilesToUpload function
 */
interface getFilesToUploadRequest {
  /** The directory in which to search for the files */
  sourceDir: string
  /** The file pattern to filter the files */
  filePattern: string
}

/**
 * Find the files to be uploaded
 * @param sourceDir - The directory glob to search the files to upload
 * @returns pathes All the matching files
 */
async function getFilesToUpload(
  params: getFilesToUploadRequest
): Promise<string[]> {
  const { sourceDir, filePattern } = params
  return globby([path.join(sourceDir, filePattern)])
}

/**
 * Reads the input data from from the environment
 * @returns
 */
function getInputData() {
  const connectionString = core.getInput('connection_string')
  const containerName = core.getInput('container_name')
  const sourceDir = core.getInput('source_dir')
  const filePattern = core.getInput('file_pattern') || '*.*'
  const leaseVal = core.getInput('lease')

  core.setSecret('connection_string')

  if (
    connectionString === undefined ||
    containerName === undefined ||
    sourceDir === undefined
  ) {
    throw new Error(`Mandatory variables are not set`)
  }

  let lease: number | undefined
  if (leaseVal !== undefined) {
    lease = parseInt(leaseVal, 10)
  }

  return { connectionString, containerName, sourceDir, filePattern, lease }
}

/**
 * Prints a Help message to the user in case of an error
 * @returns void
 */
function printHelp(): void {
  console.log(`
  -------------------------------------------  
  - blob upload Action
  -------------------------------------------  
  The Following Parameter are supported:
    connection_string - (mandatory) The Azure connection string for the blob Storage
    container_name    - (mandatory) The Azure container name
    source_dir        - (mandatory) The Source directory which contains the files to be uploaded.
    file_pattern      - The pattern to filter the files. Default ist '*.*'
                        It uses globby so wildcards are possible.
                        -----------------------------------------
                        * matches any number of characters, but not /
                        ? matches a single character, but not /
                        ** matches any number of characters, including /, as long as it's the only thing in a path part
                        {} allows for a comma-separated list of "or" expressions
                        ! at the beginning of a pattern will negate the match
    lease             - The lease in seconds. If not given no lease will be set.
                        Must be between 15 to 60 seconds, or infinite (-1)

`)
}
