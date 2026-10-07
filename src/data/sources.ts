// Shared provenance metadata for curated content.
//
// Every factual record in src/data carries the sources it was checked against so
// the UI can show where a value came from, and so future refreshes know what to
// re-verify. `checked` is an ISO date (YYYY-MM-DD) and means "this value was
// confirmed against the source on that date", not the date of the source itself.

export type Source = {
  /** Publisher or work the value was checked against. */
  label: string
  url: string
  /** ISO date (YYYY-MM-DD) the value was last verified. */
  checked: string
}

/** How confidently a record can be presented as fact. */
export type RecordConfidence =
  /** Physically exists today and can be visited. */
  | 'verified'
  /** Attested by historical sources but no longer survives; wording must stay qualified. */
  | 'attested'
  /** Site or location is debated or has never been conclusively identified. */
  | 'disputed'

export const CONFIDENCE_LABEL_KEY: Record<RecordConfidence, string> = {
  verified: 'source.confidence.verified',
  attested: 'source.confidence.attested',
  disputed: 'source.confidence.disputed',
}
