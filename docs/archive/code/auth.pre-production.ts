import { createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
export interface SessionStore { findOrCreateUser(sessionHash:string):Promise<string> }
export interface AuthContext { userId:string }
export interface AuthProvider { authenticate(request:FastifyRequest,reply:FastifyReply):Promise<AuthContext> }
export class AnonymousSessionAuth implements AuthProvider { constructor(private store:SessionStore,private production=false){} async authenticate(request:FastifyRequest,reply:FastifyReply){let session=request.cookies.tb_session;if(!session||session.length!==64){session=randomBytes(32).toString('hex');reply.setCookie('tb_session',session,{httpOnly:true,secure:this.production,sameSite:'lax',path:'/',maxAge:60*60*24*365});}const hash=createHash('sha256').update(session).digest('hex');return {userId:await this.store.findOrCreateUser(hash)};} }
