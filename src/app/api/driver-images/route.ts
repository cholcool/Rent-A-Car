import { createDriverImageDeleteRoute, createDriverImagePostRoute } from '../_utils/image-upload'

export const POST = createDriverImagePostRoute()
export const DELETE = createDriverImageDeleteRoute()
