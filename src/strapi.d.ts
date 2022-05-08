export {};

declare global {
  import { StrapiInterface } from '@strapi/strapi';
  import { Database } from '@strapi/database';

  interface AllTypes {
    [key: string]: any;
  }
  interface OverrideStrapiInterface extends StrapiInterface {
    query: Database['query'];
    getModel: any;
  }
  const strapi: OverrideStrapiInterface;
}

declare module '@strapi/utils';
