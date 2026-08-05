import { deleteImage, uploadImage } from '../_utils/image-upload'

export const POST = (request: Request) => uploadImage('user', request)
export const DELETE = (request: Request) => deleteImage('user', request)
