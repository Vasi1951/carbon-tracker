import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class SecretManagerService {
  private client: SecretManagerServiceClient | null = null;
  private projectPath: string | null = null;

  constructor() {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
      if (projectId && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE)) {
        this.client = new SecretManagerServiceClient();
        this.projectPath = `projects/${projectId}`;
      }
    } catch (err) {
      console.warn('Secret Manager failed to initialize, using local env fallback.', err);
    }
  }

  public async getSecret(name: string): Promise<string> {
    if (this.client && this.projectPath) {
      try {
        const [version] = await this.client.accessSecretVersion({
          name: `${this.projectPath}/secrets/${name}/versions/latest`,
        });
        const payload = version.payload?.data?.toString();
        if (payload) return payload;
      } catch (err) {
        console.warn(`Failed to fetch secret ${name} from Secret Manager. Using fallback.`, err);
      }
    }
    const envVal = process.env[name];
    if (envVal !== undefined) return envVal;
    throw new Error(`Secret "${name}" is not defined in Secret Manager or environment variables.`);
  }
}
