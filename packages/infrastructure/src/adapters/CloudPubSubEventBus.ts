import { IEventBus, CarbonEvent } from '@carbon-tracker/application';
import { PubSub } from '@google-cloud/pubsub';

export class CloudPubSubEventBus implements IEventBus {
  private pubsub: PubSub | null = null;
  public mockEvents: CarbonEvent[] = [];

  constructor() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.PUBSUB_EMULATOR_HOST) {
        this.pubsub = new PubSub();
      }
    } catch (err) {
      console.warn('Cloud Pub/Sub failed to initialize, running in in-memory mode.', err);
    }
  }

  public async publish(event: CarbonEvent): Promise<void> {
    this.mockEvents.push(event);
    if (!this.pubsub) return;

    try {
      const topicName = this.getTopicName(event.type);
      const dataBuffer = Buffer.from(JSON.stringify(event.payload));
      await this.pubsub.topic(topicName).publishMessage({ data: dataBuffer });
    } catch (err) {
      console.error(`Failed to publish event to Pub/Sub:`, err);
      try {
        await this.pubsub.topic('dead-letter-queue').publishMessage({
          data: Buffer.from(JSON.stringify({ event, error: String(err) })),
        });
      } catch (dlqErr) {
        console.error('Failed to publish to Dead Letter Queue:', dlqErr);
      }
    }
  }

  private getTopicName(eventType: string): string {
    if (eventType === 'ActivityRecorded') return 'activity-recorded';
    if (eventType === 'GoalAchieved') return 'goal-achieved';
    return 'milestone-reached';
  }
}
