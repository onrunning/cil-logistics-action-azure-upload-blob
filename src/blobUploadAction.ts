import { blobUpload } from './blobUpload'

blobUpload()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Job Successful')
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.log('Job failed')
  })
