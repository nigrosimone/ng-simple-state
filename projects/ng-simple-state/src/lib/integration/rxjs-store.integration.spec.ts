/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, take } from 'rxjs';
import { NgSimpleStateBaseRxjsStore } from '../rxjs/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { undoRedoPlugin, NgSimpleStateUndoRedoPlugin } from '../plugin/ng-simple-state-plugin';

// --- Chat Application State ---

interface Message {
    id: string;
    userId: string;
    content: string;
    timestamp: number;
    edited: boolean;
    reactions: { emoji: string; count: number }[];
}

interface ChatRoom {
    id: string;
    name: string;
    participants: string[];
    messages: Message[];
    typing: string[];
    lastActivity: number;
}

interface ChatState {
    rooms: ChatRoom[];
    activeRoomId: string | null;
    currentUserId: string;
    onlineUsers: string[];
    connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

@Injectable()
class ChatStore extends NgSimpleStateBaseRxjsStore<ChatState> {

    private messageIdCounter = 0;

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'ChatStore'
        };
    }

    initialState(): ChatState {
        return {
            rooms: [],
            activeRoomId: null,
            currentUserId: 'user1',
            onlineUsers: ['user1'],
            connectionStatus: 'disconnected'
        };
    }

    // Selectors
    selectRooms(): Observable<ChatRoom[]> {
        return this.selectState(state => state.rooms);
    }

    selectActiveRoom(): Observable<ChatRoom | undefined> {
        return this.selectState(state => 
            state.rooms.find(r => r.id === state.activeRoomId)
        );
    }

    selectActiveRoomMessages(): Observable<Message[]> {
        return this.selectState(state => {
            const room = state.rooms.find(r => r.id === state.activeRoomId);
            return room?.messages ?? [];
        });
    }

    selectUnreadCount(roomId: string): Observable<number> {
        return this.selectState(state => {
            const room = state.rooms.find(r => r.id === roomId);
            // Simple unread simulation: last 5 messages are "unread"
            return Math.min(room?.messages.length ?? 0, 5);
        });
    }

    selectTypingUsers(): Observable<string[]> {
        return this.selectState(state => {
            const room = state.rooms.find(r => r.id === state.activeRoomId);
            return room?.typing ?? [];
        });
    }

    selectConnectionStatus(): Observable<ChatState['connectionStatus']> {
        return this.selectState(state => state.connectionStatus);
    }

    // Actions
    addRoom(id: string, name: string, participants: string[]): boolean {
        return this.setState(state => ({
            rooms: [...state.rooms, {
                id,
                name,
                participants,
                messages: [],
                typing: [],
                lastActivity: Date.now()
            }]
        }));
    }

    setActiveRoom(roomId: string | null): boolean {
        return this.setState({ activeRoomId: roomId });
    }

    sendMessage(content: string): boolean {
        const messageId = `msg_${++this.messageIdCounter}`;
        return this.setState(state => {
            if (!state.activeRoomId) return state;
            
            return {
                rooms: state.rooms.map(room =>
                    room.id === state.activeRoomId
                        ? {
                            ...room,
                            messages: [...room.messages, {
                                id: messageId,
                                userId: state.currentUserId,
                                content,
                                timestamp: Date.now(),
                                edited: false,
                                reactions: []
                            }],
                            lastActivity: Date.now()
                        }
                        : room
                )
            };
        });
    }

    editMessage(roomId: string, messageId: string, newContent: string): boolean {
        return this.setState(state => ({
            rooms: state.rooms.map(room =>
                room.id === roomId
                    ? {
                        ...room,
                        messages: room.messages.map(msg =>
                            msg.id === messageId
                                ? { ...msg, content: newContent, edited: true }
                                : msg
                        )
                    }
                    : room
            )
        }));
    }

    addReaction(roomId: string, messageId: string, emoji: string): boolean {
        return this.setState(state => ({
            rooms: state.rooms.map(room =>
                room.id === roomId
                    ? {
                        ...room,
                        messages: room.messages.map(msg => {
                            if (msg.id !== messageId) return msg;
                            
                            const existingReaction = msg.reactions.find(r => r.emoji === emoji);
                            if (existingReaction) {
                                return {
                                    ...msg,
                                    reactions: msg.reactions.map(r =>
                                        r.emoji === emoji
                                            ? { ...r, count: r.count + 1 }
                                            : r
                                    )
                                };
                            }
                            return {
                                ...msg,
                                reactions: [...msg.reactions, { emoji, count: 1 }]
                            };
                        })
                    }
                    : room
            )
        }));
    }

    setTyping(userId: string, isTyping: boolean): boolean {
        return this.setState(state => {
            const activeRoomId = state.activeRoomId;
            if (!activeRoomId) return state;
            
            return {
                rooms: state.rooms.map(room =>
                    room.id === activeRoomId
                        ? {
                            ...room,
                            typing: isTyping
                                ? [...new Set([...room.typing, userId])]
                                : room.typing.filter(id => id !== userId)
                        }
                        : room
                )
            };
        });
    }

    setConnectionStatus(status: ChatState['connectionStatus']): boolean {
        return this.setState({ connectionStatus: status });
    }

    setOnlineUsers(users: string[]): boolean {
        return this.setState({ onlineUsers: users });
    }

    deleteMessage(roomId: string, messageId: string): boolean {
        return this.setState(state => ({
            rooms: state.rooms.map(room =>
                room.id === roomId
                    ? {
                        ...room,
                        messages: room.messages.filter(m => m.id !== messageId)
                    }
                    : room
            )
        }));
    }

    leaveRoom(roomId: string): boolean {
        return this.setState(state => ({
            rooms: state.rooms.filter(r => r.id !== roomId),
            activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId
        }));
    }
}

// --- Kanban Board State ---

interface KanbanCard {
    id: string;
    title: string;
    description: string;
    assignee: string | null;
    labels: string[];
    dueDate: number | null;
    priority: number;
}

interface KanbanColumn {
    id: string;
    title: string;
    cards: KanbanCard[];
    limit: number | null;
}

interface KanbanState {
    columns: KanbanColumn[];
    draggedCardId: string | null;
    selectedCardId: string | null;
}

@Injectable()
class KanbanStore extends NgSimpleStateBaseRxjsStore<KanbanState> {

    private cardIdCounter = 0;

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'KanbanBoard'
        };
    }

    initialState(): KanbanState {
        return {
            columns: [
                { id: 'todo', title: 'To Do', cards: [], limit: null },
                { id: 'in-progress', title: 'In Progress', cards: [], limit: 3 },
                { id: 'review', title: 'Review', cards: [], limit: 2 },
                { id: 'done', title: 'Done', cards: [], limit: null }
            ],
            draggedCardId: null,
            selectedCardId: null
        };
    }

    selectColumns(): Observable<KanbanColumn[]> {
        return this.selectState(state => state.columns);
    }

    selectColumn(columnId: string): Observable<KanbanColumn | undefined> {
        return this.selectState(state => state.columns.find(c => c.id === columnId));
    }

    selectCardCount(): Observable<number> {
        return this.selectState(state => 
            state.columns.reduce((sum, col) => sum + col.cards.length, 0)
        );
    }

    addCard(columnId: string, title: string, description: string = ''): boolean {
        const cardId = `card_${++this.cardIdCounter}`;
        return this.setState(state => ({
            columns: state.columns.map(col =>
                col.id === columnId
                    ? {
                        ...col,
                        cards: [...col.cards, {
                            id: cardId,
                            title,
                            description,
                            assignee: null,
                            labels: [],
                            dueDate: null,
                            priority: 0
                        }]
                    }
                    : col
            )
        }));
    }

    moveCard(cardId: string, fromColumnId: string, toColumnId: string): boolean {
        return this.setState(state => {
            const fromColumn = state.columns.find(c => c.id === fromColumnId);
            const toColumn = state.columns.find(c => c.id === toColumnId);
            const card = fromColumn?.cards.find(c => c.id === cardId);
            
            if (!card || !fromColumn || !toColumn) return state;
            
            // Check WIP limit
            if (toColumn.limit !== null && toColumn.cards.length >= toColumn.limit) {
                return state; // Don't move if limit reached
            }
            
            return {
                ...state,
                columns: state.columns.map(col => {
                    if (col.id === fromColumnId) {
                        return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
                    }
                    if (col.id === toColumnId) {
                        return { ...col, cards: [...col.cards, card] };
                    }
                    return col;
                })
            };
        });
    }

    updateCard(cardId: string, updates: Partial<KanbanCard>): boolean {
        return this.setState(state => ({
            columns: state.columns.map(col => ({
                ...col,
                cards: col.cards.map(card =>
                    card.id === cardId ? { ...card, ...updates } : card
                )
            }))
        }));
    }

    deleteCard(cardId: string): boolean {
        return this.setState(state => ({
            columns: state.columns.map(col => ({
                ...col,
                cards: col.cards.filter(c => c.id !== cardId)
            })),
            selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId
        }));
    }

    setDraggedCard(cardId: string | null): boolean {
        return this.setState({ draggedCardId: cardId });
    }

    selectCard(cardId: string | null): boolean {
        return this.setState({ selectedCardId: cardId });
    }

    addLabel(cardId: string, label: string): boolean {
        return this.setState(state => ({
            columns: state.columns.map(col => ({
                ...col,
                cards: col.cards.map(card =>
                    card.id === cardId && !card.labels.includes(label)
                        ? { ...card, labels: [...card.labels, label] }
                        : card
                )
            }))
        }));
    }
}

// --- Integration Tests ---

describe('RxJS Chat Application Integration Tests', () => {

    let chatStore: ChatStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                ChatStore
            ]
        });
        chatStore = TestBed.inject(ChatStore);
    });

    describe('Room Management', () => {

        it('should create a new chat room', async () => {
            chatStore.addRoom('room1', 'General', ['user1', 'user2']);

            const rooms = await firstValueFrom(chatStore.selectRooms());
            expect(rooms.length).toBe(1);
            expect(rooms[0].name).toBe('General');
        });

        it('should set active room', async () => {
            chatStore.addRoom('room1', 'General', ['user1']);
            chatStore.setActiveRoom('room1');

            const activeRoom = await firstValueFrom(chatStore.selectActiveRoom());
            expect(activeRoom?.id).toBe('room1');
        });

        it('should manage multiple rooms', async () => {
            chatStore.addRoom('room1', 'General', ['user1']);
            chatStore.addRoom('room2', 'Random', ['user1', 'user2']);
            chatStore.addRoom('room3', 'Work', ['user1', 'user2', 'user3']);

            const rooms = await firstValueFrom(chatStore.selectRooms());
            expect(rooms.length).toBe(3);
        });

        it('should leave a room', async () => {
            chatStore.addRoom('room1', 'General', ['user1']);
            chatStore.setActiveRoom('room1');
            
            chatStore.leaveRoom('room1');
            
            const rooms = await firstValueFrom(chatStore.selectRooms());
            expect(rooms.length).toBe(0);
            expect(chatStore.getCurrentState().activeRoomId).toBeNull();
        });
    });

    describe('Messaging', () => {

        beforeEach(() => {
            chatStore.addRoom('room1', 'General', ['user1', 'user2']);
            chatStore.setActiveRoom('room1');
        });

        it('should send a message', async () => {
            chatStore.sendMessage('Hello World!');

            const messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            expect(messages.length).toBe(1);
            expect(messages[0].content).toBe('Hello World!');
            expect(messages[0].userId).toBe('user1');
        });

        it('should send multiple messages', async () => {
            chatStore.sendMessage('First message');
            chatStore.sendMessage('Second message');
            chatStore.sendMessage('Third message');

            const messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            expect(messages.length).toBe(3);
        });

        it('should edit a message', async () => {
            chatStore.sendMessage('Original message');
            
            const messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            const messageId = messages[0].id;
            
            chatStore.editMessage('room1', messageId, 'Edited message');
            
            const updatedMessages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            expect(updatedMessages[0].content).toBe('Edited message');
            expect(updatedMessages[0].edited).toBeTrue();
        });

        it('should delete a message', async () => {
            chatStore.sendMessage('Message to delete');
            chatStore.sendMessage('Keep this message');
            
            let messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            const messageIdToDelete = messages[0].id;
            
            chatStore.deleteMessage('room1', messageIdToDelete);
            
            messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            expect(messages.length).toBe(1);
            expect(messages[0].content).toBe('Keep this message');
        });

        it('should add reactions to messages', async () => {
            chatStore.sendMessage('React to me!');
            
            const messages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            const messageId = messages[0].id;
            
            chatStore.addReaction('room1', messageId, '👍');
            chatStore.addReaction('room1', messageId, '❤️');
            chatStore.addReaction('room1', messageId, '👍'); // Add same again
            
            const updatedMessages = await firstValueFrom(chatStore.selectActiveRoomMessages());
            expect(updatedMessages[0].reactions.length).toBe(2);
            expect(updatedMessages[0].reactions.find(r => r.emoji === '👍')?.count).toBe(2);
        });
    });

    describe('Typing Indicators', () => {

        beforeEach(() => {
            chatStore.addRoom('room1', 'General', ['user1', 'user2', 'user3']);
            chatStore.setActiveRoom('room1');
        });

        it('should show typing user', async () => {
            chatStore.setTyping('user2', true);

            const typing = await firstValueFrom(chatStore.selectTypingUsers());
            expect(typing).toContain('user2');
        });

        it('should remove typing user', async () => {
            chatStore.setTyping('user2', true);
            chatStore.setTyping('user2', false);

            const typing = await firstValueFrom(chatStore.selectTypingUsers());
            expect(typing).not.toContain('user2');
        });

        it('should handle multiple typing users', async () => {
            chatStore.setTyping('user2', true);
            chatStore.setTyping('user3', true);

            const typing = await firstValueFrom(chatStore.selectTypingUsers());
            expect(typing.length).toBe(2);
        });
    });

    describe('Connection Status', () => {

        it('should track connection status changes', async () => {
            expect(await firstValueFrom(chatStore.selectConnectionStatus())).toBe('disconnected');
            
            chatStore.setConnectionStatus('connecting');
            expect(await firstValueFrom(chatStore.selectConnectionStatus())).toBe('connecting');
            
            chatStore.setConnectionStatus('connected');
            expect(await firstValueFrom(chatStore.selectConnectionStatus())).toBe('connected');
        });

        it('should track online users', () => {
            chatStore.setOnlineUsers(['user1', 'user2', 'user3']);
            
            expect(chatStore.getCurrentState().onlineUsers).toEqual(['user1', 'user2', 'user3']);
        });
    });
});

describe('RxJS Kanban Board Integration Tests', () => {

    let kanbanStore: KanbanStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                KanbanStore
            ]
        });
        kanbanStore = TestBed.inject(KanbanStore);
    });

    describe('Card Management', () => {

        it('should add cards to columns', async () => {
            kanbanStore.addCard('todo', 'Task 1', 'Description 1');
            kanbanStore.addCard('todo', 'Task 2');
            
            const columns = await firstValueFrom(kanbanStore.selectColumns());
            const todoColumn = columns.find(c => c.id === 'todo');
            
            expect(todoColumn?.cards.length).toBe(2);
        });

        it('should move cards between columns', async () => {
            kanbanStore.addCard('todo', 'Task to move');
            
            let columns = await firstValueFrom(kanbanStore.selectColumns());
            const cardId = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            kanbanStore.moveCard(cardId, 'todo', 'in-progress');
            
            columns = await firstValueFrom(kanbanStore.selectColumns());
            expect(columns.find(c => c.id === 'todo')!.cards.length).toBe(0);
            expect(columns.find(c => c.id === 'in-progress')!.cards.length).toBe(1);
        });

        it('should respect WIP limits', async () => {
            // In Progress has limit of 3
            kanbanStore.addCard('in-progress', 'Task 1');
            kanbanStore.addCard('in-progress', 'Task 2');
            kanbanStore.addCard('in-progress', 'Task 3');
            
            // Add a card to todo and try to move it
            kanbanStore.addCard('todo', 'Overflow task');
            
            let columns = await firstValueFrom(kanbanStore.selectColumns());
            const overflowCardId = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            // This should not move (limit reached)
            kanbanStore.moveCard(overflowCardId, 'todo', 'in-progress');
            
            columns = await firstValueFrom(kanbanStore.selectColumns());
            expect(columns.find(c => c.id === 'in-progress')!.cards.length).toBe(3);
            expect(columns.find(c => c.id === 'todo')!.cards.length).toBe(1);
        });

        it('should update card properties', async () => {
            kanbanStore.addCard('todo', 'Original Title');
            
            let columns = await firstValueFrom(kanbanStore.selectColumns());
            const cardId = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            kanbanStore.updateCard(cardId, {
                title: 'Updated Title',
                description: 'New description',
                priority: 1
            });
            
            columns = await firstValueFrom(kanbanStore.selectColumns());
            const updatedCard = columns.find(c => c.id === 'todo')!.cards[0];
            
            expect(updatedCard.title).toBe('Updated Title');
            expect(updatedCard.description).toBe('New description');
            expect(updatedCard.priority).toBe(1);
        });

        it('should delete cards', async () => {
            kanbanStore.addCard('todo', 'Task to delete');
            kanbanStore.addCard('todo', 'Task to keep');
            
            let columns = await firstValueFrom(kanbanStore.selectColumns());
            const cardIdToDelete = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            kanbanStore.deleteCard(cardIdToDelete);
            
            columns = await firstValueFrom(kanbanStore.selectColumns());
            expect(columns.find(c => c.id === 'todo')!.cards.length).toBe(1);
        });

        it('should add labels to cards', async () => {
            kanbanStore.addCard('todo', 'Labeled Task');
            
            let columns = await firstValueFrom(kanbanStore.selectColumns());
            const cardId = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            kanbanStore.addLabel(cardId, 'bug');
            kanbanStore.addLabel(cardId, 'priority');
            kanbanStore.addLabel(cardId, 'bug'); // Duplicate, should not add
            
            columns = await firstValueFrom(kanbanStore.selectColumns());
            const card = columns.find(c => c.id === 'todo')!.cards[0];
            
            expect(card.labels).toEqual(['bug', 'priority']);
        });
    });

    describe('Selection and Drag State', () => {

        it('should select and deselect cards', () => {
            kanbanStore.selectCard('card1');
            expect(kanbanStore.getCurrentState().selectedCardId).toBe('card1');
            
            kanbanStore.selectCard(null);
            expect(kanbanStore.getCurrentState().selectedCardId).toBeNull();
        });

        it('should track dragged card', () => {
            kanbanStore.setDraggedCard('card1');
            expect(kanbanStore.getCurrentState().draggedCardId).toBe('card1');
            
            kanbanStore.setDraggedCard(null);
            expect(kanbanStore.getCurrentState().draggedCardId).toBeNull();
        });

        it('should clear selection when card is deleted', async () => {
            kanbanStore.addCard('todo', 'Task');
            
            const columns = await firstValueFrom(kanbanStore.selectColumns());
            const cardId = columns.find(c => c.id === 'todo')!.cards[0].id;
            
            kanbanStore.selectCard(cardId);
            kanbanStore.deleteCard(cardId);
            
            expect(kanbanStore.getCurrentState().selectedCardId).toBeNull();
        });
    });

    describe('Metrics', () => {

        it('should count total cards', async () => {
            kanbanStore.addCard('todo', 'Task 1');
            kanbanStore.addCard('in-progress', 'Task 2');
            kanbanStore.addCard('done', 'Task 3');
            
            const count = await firstValueFrom(kanbanStore.selectCardCount());
            expect(count).toBe(3);
        });
    });
});

describe('RxJS Store with Undo/Redo Plugin', () => {

    let chatStore: ChatStore;
    let plugin: NgSimpleStateUndoRedoPlugin<ChatState>;

    beforeEach(() => {
        plugin = undoRedoPlugin<ChatState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false, plugins: [plugin] }),
                ChatStore
            ]
        });
        chatStore = TestBed.inject(ChatStore);
    });

    it('should undo room creation', async () => {
        chatStore.addRoom('room1', 'General', ['user1']);
        
        expect((await firstValueFrom(chatStore.selectRooms())).length).toBe(1);
        
        const prevState = plugin.undo('ChatStore');
        chatStore.replaceState(prevState!);
        
        expect((await firstValueFrom(chatStore.selectRooms())).length).toBe(0);
    });

    it('should redo room creation', async () => {
        chatStore.addRoom('room1', 'General', ['user1']);
        
        const prevState = plugin.undo('ChatStore');
        chatStore.replaceState(prevState!);
        
        const nextState = plugin.redo('ChatStore');
        chatStore.replaceState(nextState!);
        
        expect((await firstValueFrom(chatStore.selectRooms())).length).toBe(1);
    });

    it('should undo message sending', async () => {
        chatStore.addRoom('room1', 'General', ['user1']);
        chatStore.setActiveRoom('room1');
        chatStore.sendMessage('Hello');
        chatStore.sendMessage('World');
        
        expect((await firstValueFrom(chatStore.selectActiveRoomMessages())).length).toBe(2);
        
        // Undo last message
        const prevState = plugin.undo('ChatStore');
        chatStore.replaceState(prevState!);
        
        expect((await firstValueFrom(chatStore.selectActiveRoomMessages())).length).toBe(1);
    });
});
