type Address = {
  street?: string
}

export function Address() {
  return (
    <div data-cy="street" dataTestId="MyAddress">
      Main
    </div>
  )
}
