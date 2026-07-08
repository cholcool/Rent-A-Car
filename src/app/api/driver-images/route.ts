import { deleteImage, uploadImage } from '../_utils/image-upload'

export const POST = (request: Request) => uploadImage('driver', request)
export const DELETE = (request: Request) => deleteImage('driver', request)
