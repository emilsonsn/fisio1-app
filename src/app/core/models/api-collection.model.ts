export interface ApiCollection<T> {
  data: T[];
  meta?: {
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    from?: number | null;
    to?: number | null;
  };
}
