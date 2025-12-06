/**
 * ============================================
 * USAGE TRACKER
 * Track responses and chats per day
 * ============================================
 */

import { database, auth } from '../auth/firebase-config.js';
import { OWNER_EMAIL } from './plans-config.js';

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get user usage for today
 */
export async function getTodayUsage() {
    const user = auth.currentUser;
    if (!user) return null;

    // Owner has unlimited
    if (user.email === OWNER_EMAIL) {
        return {
            chatsToday: 0,
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0,
            unlimited: true
        };
    }

    const todayKey = getTodayKey();
    const usageRef = database.ref(`users/${user.uid}/usage/${todayKey}`);
    
    try {
        const snapshot = await usageRef.once('value');
        const data = snapshot.val() || {
            chatsToday: 0,
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0
        };
        
        return data;
    } catch (error) {
        console.error('❌ Error getting usage:', error);
        return {
            chatsToday: 0,
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0
        };
    }
}

/**
 * Increment chat count
 */
export async function incrementChatCount() {
    const user = auth.currentUser;
    if (!user || user.email === OWNER_EMAIL) return;

    const todayKey = getTodayKey();
    const usageRef = database.ref(`users/${user.uid}/usage/${todayKey}`);
    
    try {
        const snapshot = await usageRef.once('value');
        const data = snapshot.val() || { chatsToday: 0 };
        
        await usageRef.update({
            chatsToday: (data.chatsToday || 0) + 1,
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0
        });
        
        console.log('✅ Chat count incremented');
    } catch (error) {
        console.error('❌ Error incrementing chat:', error);
    }
}

/**
 * Increment response count in current chat
 */
export async function incrementResponseCount(isAdvanced = false) {
    const user = auth.currentUser;
    if (!user || user.email === OWNER_EMAIL) return;

    const todayKey = getTodayKey();
    const usageRef = database.ref(`users/${user.uid}/usage/${todayKey}`);
    
    try {
        const snapshot = await usageRef.once('value');
        const data = snapshot.val() || { 
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0
        };
        
        const updates = {
            responsesInCurrentChat: (data.responsesInCurrentChat || 0) + 1
        };

        if (isAdvanced) {
            updates.advancedUsageInCurrentChat = (data.advancedUsageInCurrentChat || 0) + 1;
        }
        
        await usageRef.update(updates);
        
        console.log('✅ Response count incremented');
    } catch (error) {
        console.error('❌ Error incrementing response:', error);
    }
}

/**
 * Check if user can send message
 */
export async function canSendMessage(userPlan) {
    const user = auth.currentUser;
    if (!user) return { allowed: false, reason: 'Not logged in' };

    // Owner unlimited
    if (user.email === OWNER_EMAIL) {
        return { allowed: true };
    }

    const usage = await getTodayUsage();
    
    // Check chat limit
    if (usage.chatsToday >= userPlan.chatsPerDay) {
        return { 
            allowed: false, 
            reason: `Daily chat limit reached (${userPlan.chatsPerDay} chats)`,
            showUpgrade: true
        };
    }

    // Check response limit
    if (usage.responsesInCurrentChat >= userPlan.responsesPerChat) {
        return { 
            allowed: false, 
            reason: `Chat response limit reached (${userPlan.responsesPerChat} responses)`,
            showNewChat: true
        };
    }

    // Check advanced usage for MAX plan
    if (userPlan.id === 'max' && userPlan.maxAdvancedUsage) {
        if (usage.advancedUsageInCurrentChat >= userPlan.maxAdvancedUsage) {
            return {
                allowed: true,
                useBasicModel: true // Fallback to 20B
            };
        }
    }

    return { allowed: true };
}

/**
 * Reset chat response counter (for new chat)
 */
export async function resetChatResponseCounter() {
    const user = auth.currentUser;
    if (!user || user.email === OWNER_EMAIL) return;

    const todayKey = getTodayKey();
    const usageRef = database.ref(`users/${user.uid}/usage/${todayKey}`);
    
    try {
        await usageRef.update({
            responsesInCurrentChat: 0,
            advancedUsageInCurrentChat: 0
        });
        
        console.log('✅ Chat response counter reset');
    } catch (error) {
        console.error('❌ Error resetting counter:', error);
    }
}

console.log('📦 Usage Tracker module loaded');
