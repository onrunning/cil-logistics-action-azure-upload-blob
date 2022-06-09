import { blobUpload } from '../src/blobUpload'

type mockValType = {
  blobName: string
  content: string
}

let mockVal: mockValType[] = []
let mockBlobExists = true
let mockBreakLeaseCalled = false
let mockAcquireLease: number | undefined

jest.mock('@azure/storage-blob', () => {
  return {
    __esModule: true,
    BlobServiceClient: {
      fromConnectionString: () => {
        return {
          __esModule: true,
          getContainerClient: () => {
            return {
              __esModule: true,
              getBlockBlobClient: (blobName: string) => {
                return {
                  __esModule: true,
                  upload: async (content: string) => {
                    mockVal.push({ blobName, content })
                  },
                  exists: async () => {
                    return mockBlobExists
                  },
                  getBlobLeaseClient: () => {
                    return {
                      __esModule: true,
                      breakLease: async () => {
                        mockBreakLeaseCalled = true
                      },
                      acquireLease: async (lease: number) => {
                        mockAcquireLease = lease
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    },
  }
})

let mockNotice: string[] = []
let mockWarning: string[] = []
let mockFailed: any
let mockInputData: { [key: string]: string | number } = {}

jest.mock('@actions/core', () => {
  return {
    __esModule: true,
    getInput: (type: string) => {
      return mockInputData[type]
    },
    notice: (txt: string) => {
      mockNotice.push(txt)
    },
    warning: (txt: string) => {
      mockWarning.push(txt)
    },
    setFailed: (obj: any) => {
      mockFailed = obj
    },
    setSecret: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  }
})

beforeEach(() => {
  mockVal = []
  mockNotice = []
  mockWarning = []
  mockFailed = undefined
  mockBlobExists = true
  mockBreakLeaseCalled = false
  mockAcquireLease = undefined
})

const expectedALlFirstLevel = [
  {
    blobName: 'oneFile.txt',
    content: 'text file',
  },
  {
    blobName: 'threeFile.xml',
    content: '<three>file</three>',
  },
  {
    blobName: 'twoFile.json',
    content: `{"two": "file"}`,
  },
]

const expectedXmlFirstLevel = [
  {
    blobName: 'threeFile.xml',
    content: '<three>file</three>',
  },
]

const expectedALlJson = [
  {
    blobName: 'twoFile.json',
    content: `{"two": "file"}`,
  },
  {
    blobName: 'subFolder/myFile.json',
    content: `{"my": "file"}`,
  },
]

test('Expect all the files from the top level directory', async () => {
  mockInputData = {
    connection_string: 'connect1',
    container_name: 'fooContainer',
    source_dir: 'tests/fixtures',
    lease: -1,
  }
  mockBlobExists = false

  await blobUpload()

  expect(mockVal).toEqual(expectedALlFirstLevel)
  expect(mockNotice).toEqual([
    'Upload the following files:\ntests/fixtures/oneFile.txt\ntests/fixtures/threeFile.xml\ntests/fixtures/twoFile.json',
    'Sucessfuly uploaded the files.',
  ])
  expect(mockWarning).toEqual([])
  expect(mockFailed).toBeUndefined()

  expect(mockBreakLeaseCalled).toBeFalsy()
  expect(mockAcquireLease).toEqual(-1)
})

test('Expect only the XML files from the top level directory', async () => {
  mockInputData = {
    connection_string: 'connect1',
    container_name: 'fooContainer',
    source_dir: 'tests/fixtures',
    file_pattern: '*.xml',
  }
  mockBlobExists = true

  await blobUpload()

  expect(mockVal).toEqual(expectedXmlFirstLevel)
  expect(mockNotice).toEqual([
    'Upload the following files:\ntests/fixtures/threeFile.xml',
    'Sucessfuly uploaded the files.',
  ])
  expect(mockWarning).toEqual([])
  expect(mockFailed).toBeUndefined()

  expect(mockBreakLeaseCalled).toBeTruthy()
  expect(mockAcquireLease).toBeUndefined()
})

test('Expect all the JSON files from all directory', async () => {
  mockInputData = {
    connection_string: 'connect1',
    container_name: 'fooContainer',
    source_dir: 'tests/fixtures',
    file_pattern: '**/*.json',
  }

  await blobUpload()

  expect(mockVal).toEqual(expectedALlJson)
  expect(mockNotice).toEqual([
    'Upload the following files:\ntests/fixtures/twoFile.json\ntests/fixtures/subFolder/myFile.json',
    'Sucessfuly uploaded the files.',
  ])
  expect(mockWarning).toEqual([])
  expect(mockFailed).toBeUndefined()
})

test('Expect warning as there are no files to upload', async () => {
  mockInputData = {
    connection_string: 'connect1',
    container_name: 'fooContainer',
    source_dir: 'tests/fixtures',
    file_pattern: '*.uml',
  }

  await blobUpload()

  expect(mockVal).toEqual([])
  expect(mockNotice).toEqual([])
  expect(mockWarning).toEqual([`There are no files for upload.`])
  expect(mockFailed).toBeUndefined()
})
