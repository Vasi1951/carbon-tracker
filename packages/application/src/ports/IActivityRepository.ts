import { Activity } from '@carbon-tracker/domain';

export interface IActivityRepository {
  save(activity: Activity): Promise<void>;
  findByUserAndPeriod(userId: string, start: Date, end: Date): Promise<Activity[]>;
  delete(id: string): Promise<void>;
}
