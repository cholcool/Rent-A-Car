import { createGuarantorImageDeleteRoute, createGuarantorImagePostRoute } from '../_utils/image-upload'

export const POST = createGuarantorImagePostRoute()
export const DELETE = createGuarantorImageDeleteRoute()
