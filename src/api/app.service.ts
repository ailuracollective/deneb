import { Injectable } from '@nestjs/common';

export interface RootView {
  tittle: string;
  nameProject: string;
  description: string;
}

@Injectable()
export class AppService {
  getRootView(): RootView {
    return {
      tittle: 'Deneb API ✨ Queuing theory calculator',
      nameProject: 'Deneb Api',
      description: 'Queuing theory calculator',
    };
  }
}
