import { blobUpload } from './blobUpload'

blobUpload()
  .then(() => {
    console.log('Job Successful')
  })
  .catch(() => {
    console.log('Job failed')
  })
