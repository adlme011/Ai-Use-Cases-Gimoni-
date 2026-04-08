export interface Account {
  id: string;
  name: string;
  region: 'US' | 'Europe';
  leads: string;
  status: 'Target' | 'Selected' | 'Active';
  jouleDeployed: boolean;
  walkMeDeployed: boolean;
}

export interface UseCase {
  id: string;
  accountId: string;
  accountName?: string;
  title: string;
  description: string;
  valueProposition: string;
  status: 'Idea' | 'Draft' | 'Feasibility' | 'Validated' | 'Productized';
  resources: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'Solution Advisor' | 'Engineering' | 'Leadership';
}
