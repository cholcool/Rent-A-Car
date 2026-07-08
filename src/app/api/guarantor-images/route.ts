import { uploadImage, deleteImage } from '../_utils/image-upload'

export const POST = (request: Request) => uploadImage('guarantor', request)
export const DELETE = (request: Request) => deleteImage('guarantor', request)
