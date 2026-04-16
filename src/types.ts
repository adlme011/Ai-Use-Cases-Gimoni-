export interface Account {
  id: string;
  name: string;
  region: 'US' | 'Europe';
  leads: string;
  status: 'Target' | 'Selected' | 'Active';
  jouleDeployed: boolean;
  walkMeDeployed: boolean;
  pocs?: string;
  department?: string;
  otherAiTools?: string;
}

export interface Task {
  id: string;
  actionItem: string;
  owner: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface UseCase {
  id: string;
  accountId: string;
  accountName?: string;
  title: string;
  summary: string; // 1-line summary
  description: string;
  problemStatement?: string;
  solution?: string;
  valueProposition: string;
  status: 'Idea' | 'Draft' | 'Feasibility' | 'Validated' | 'Productized' | 'POC';
  businessProblem?: string;
  aiCapability?: string;
  walkmeFeature?: string;
  solutionAdvisor?: string;
  userPersona?: string;
  impactMetrics?: string;
  jouleUsage?: string;
  walkmeUsage?: string;
  roiLevel: 'High' | 'Medium' | 'Experimental';
  implementationEffort: 'Low' | 'Medium' | 'High';
  useCaseType: 'Automation' | 'Content Generation' | 'Decision Support' | 'Other';
  businessFunction: 'Marketing' | 'Operations' | 'Customer Support' | 'Sales' | 'HR' | 'Finance' | 'Engineering' | 'Other';
  realWorldExample?: string;
  architectureDiagram?: string;
  examplePrompt?: string;
  tasks?: Task[];
  authorId: string;
  authorName: string;
  demoPresented?: boolean;
  recordingLink?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'Solution Advisor' | 'Engineering' | 'Leadership';
}
