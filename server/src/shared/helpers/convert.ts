export const stringBigInt = (v?: string) => {
	if (!v) return null
	try {
		return BigInt(v)
	} catch {
		return null
	}
}
