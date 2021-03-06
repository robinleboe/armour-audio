 const db =  {
    userDetails: {
        credentials: {
            userId: 'wadGb5sjVVSnTR71ah7wb3seGc72',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2019-11-18T05:06:28.356Z',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/armour-audio.appspot.com/o/204274238785.jpg?alt=media',
            bio: 'Hello, my name is user',
            website: 'https://user.com',
            location: 'Vancouver, BC, Canada'
        },
        likes: [
            {
                userHandle: 'user',
                noteId: 'wadGb5sjVVSnT' 
            },
            {
                userHandle: 'user',
                noteId: 'ah7wb3seGc7uh' 
            }
        ]
    },
    notes: [
        {
            userHandle: 'user',
            body: 'this is the note body',
            createdAt: '2019-11-15T04:52:50.982Z',
            likeCount: 5,
            commentCount: 2
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'John',
            read: 'true | false',
            noteId: 'qweqwjenqjwneqjwne',
            type: 'like | comment',
            createdAt: '2019-11-18T05:06:28.356Z'
        }
    ]
}