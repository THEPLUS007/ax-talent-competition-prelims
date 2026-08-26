import { USE_MOCK } from './config';
import * as mock from './mockTravelApi';
import * as real from './realTravelApi';
import type { TravelPlanPayload } from './mockTravelApi';
import type { SavedTravelPlan,TravelAnalysisInput,TravelDay,TripFormData } from '../types/travel';
export const createTripFromForm=(x:TripFormData)=>USE_MOCK?mock.createTripFromForm(x):real.createTripFromForm(x);
export const generateTripWithAI=(x:string)=>USE_MOCK?mock.generateTripWithAI(x):real.generateTripWithAI(x);
export const analyzeLinkOrText=(x:TravelAnalysisInput)=>USE_MOCK?mock.analyzeLinkOrText(x):real.analyzeLinkOrText(x);
export const createTripFromSource=(x:string)=>USE_MOCK?mock.createTripFromSource(x):real.createTripFromSource(x);
export const getRecommendations=(trip?:TripFormData,day?:TravelDay)=>USE_MOCK?mock.getRecommendations(trip,day):real.getRecommendations(trip,day);
export const loadTrips=()=>USE_MOCK?mock.loadTrips():real.loadTrips();
export const loadTrip=(id:string)=>USE_MOCK?mock.loadTrip(id):real.loadTrip(id);
export async function createSavedTrip(payload:TravelPlanPayload):Promise<SavedTravelPlan>{if(USE_MOCK){await mock.saveTrip(payload);return (await mock.loadTrips())[0]}return real.createSavedTrip(payload)}
export async function updateSavedTrip(id:string,version:number,payload:TravelPlanPayload):Promise<SavedTravelPlan>{if(USE_MOCK)return createSavedTrip(payload);return real.updateSavedTrip(id,version,payload)}
export const saveTrip=async(payload:TravelPlanPayload)=>{await createSavedTrip(payload);return {ok:true as const}};
