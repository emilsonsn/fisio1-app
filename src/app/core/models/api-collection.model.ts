export interface ApiCollection<T> {
  data: T[];
  meta?: {
    total: number;
  };
}
