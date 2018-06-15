import * as fetch from 'node-fetch';
import { Request, Headers } from 'node-fetch';

export default class Api {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async fetchOrganizations() {
    const res = await fetch(
      new Request(`https://tmc.mooc.fi/api/v8/org.json`, {
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
    );
    return await res.json();
  }

  async fetchCourses(organizationSlug: string) {
    const res = await fetch(
      new Request(
        `https://tmc.mooc.fi/api/v8/core/org/${organizationSlug}/courses?access_token=${
          this.accessToken
        }`,
        {
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
        }
      )
    );
    return await res.json();
  }

  async fetchCourseDetails(course: any) {
    const res = await fetch(
      new Request(`${course['details_url']}?access_token=${this.accessToken}`, {
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
    );
    return (await res.json()).course;
  }

  async downloadExercise(exercise: any): Promise<ArrayBuffer> {
    const res = await fetch(
      new Request(`${exercise['zip_url']}?access_token=${this.accessToken}`, {
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
    );
    return res.buffer();
  }
}
