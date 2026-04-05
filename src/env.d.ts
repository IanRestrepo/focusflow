/// <reference path="../.astro/types.d.ts" />
import type PocketBase from 'pocketbase';

declare namespace App {
  interface Locals {
    pb: PocketBase;
    user: Record<string, any>;
  }
}
