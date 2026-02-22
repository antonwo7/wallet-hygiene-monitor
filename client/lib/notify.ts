import toast from 'react-hot-toast'

export function notifyError(err: unknown, fallback = 'Something went wrong') {
	const msg =
		err instanceof Error
			? err.message
			: typeof err === 'string'
				? err
				: fallback
	toast.error(msg || fallback)
}

export function notifySuccess(message: string) {
	toast.success(message)
}
