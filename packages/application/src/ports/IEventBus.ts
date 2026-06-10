export type ActivityRecordedEvent = {
  type: 'ActivityRecorded';
  payload: {
    userId: string;
    activityId: string;
    kgCO2e: number;
  };
};

export type GoalAchievedEvent = {
  type: 'GoalAchieved';
  payload: {
    userId: string;
    goalId: string;
    target: number;
  };
};

export type MilestoneReachedEvent = {
  type: 'MilestoneReached';
  payload: {
    userId: string;
    milestone: string;
  };
};

export type CarbonEvent = ActivityRecordedEvent | GoalAchievedEvent | MilestoneReachedEvent;

export interface IEventBus {
  publish(event: CarbonEvent): Promise<void>;
}
