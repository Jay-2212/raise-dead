/**
 * Data contract passed from GraveyardWorld → ResurrectionRitual scene.
 */
export interface RitualData {
  graveId: string;
  graveName: string;
  /** World-space X of the tombstone being raised */
  tombstoneWorldX: number;
  /** World-space Y of the tombstone being raised */
  tombstoneWorldY: number;
}
