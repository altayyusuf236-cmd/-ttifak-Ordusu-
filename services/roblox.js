const axios = require('axios');
const robloxClient = axios.create({
  baseURL: 'https://groups.roblox.com/v1',
  headers: {
    'Cookie': `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
    'Content-Type': 'application/json'
  }
});

async function getUserIdByUsername(username) {
  try {
    const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: true
    });
    return res.data.data[0] ? res.data.data[0].id : null;
  } catch (e) {
    return null;
  }
}

async function getUsernameById(userId) {
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data.name;
  } catch (e) {
    return null;
  }
}

async function getUserBio(userId) {
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data.description || '';
  } catch (e) {
    return null;
  }
}

async function getUserGroups(userId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    return res.data.data.map(item => ({
      groupId: item.group.id,
      groupName: item.group.name,
      roleName: item.role.name,
      roleRank: item.role.rank
    }));
  } catch (e) {
    return [];
  }
}

async function getMemberRank(groupId, userId) {
  try {
    const res = await robloxClient.get(`/groups/${groupId}/users/${userId}`);
    return res.data.role ? res.data.role.rank : 0;
  } catch (e) {
    return null;
  }
}

// YENİ: Rütbe çekme işlemini cookie'siz genel axios ile yapıyoruz (Yüklenmeme sorununu çözer)
async function getGroupRoles(groupId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
    return res.data.roles || [];
  } catch (e) {
    console.error('getGroupRoles Hatası:', e.response?.data || e.message);
    return [];
  }
}

async function setRank(groupId, userId, rankLevel) {
  try {
    const roles = await getGroupRoles(groupId);
    const targetRole = roles.find(r => r.rank === Number(rankLevel) || r.id === Number(rankLevel));
    
    if (!targetRole) {
      console.error(`Rütbe bulunamadı: GroupID: ${groupId}, RankLevel: ${rankLevel}`);
      return false;
    }

    await robloxClient.patch(`/groups/${groupId}/users/${userId}`, {
      roleId: targetRole.id
    });
    return true;
  } catch (e) {
    console.error('Roblox setRank hatası:', e.response?.data || e.message);
    return false;
  }
}

async function getRankLevelByName(groupId, rankName) {
  try {
    const roles = await getGroupRoles(groupId);
    const role = roles.find(r => r.name.toLowerCase() === rankName.toLowerCase());
    return role ? role.rank : null;
  } catch (e) {
    return null;
  }
}

async function banFromGroup(groupId, userId) {
  try {
    await robloxClient.delete(`/groups/${groupId}/users/${userId}`);
    return true;
  } catch (e) {
    console.error('Roblox ban hatası:', e.response?.data || e.message);
    return false;
  }
}

async function getGroupActivity(groupId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/wall/posts?limit=1`);
    const lastPost = res.data.data[0]?.created;
    if (!lastPost) return false;
    const diff = Date.now() - new Date(lastPost).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getUserIdByUsername,
  getUsernameById,
  getUserBio,
  getUserGroups,
  getMemberRank,
  setRank,
  getRankLevelByName,
  banFromGroup,
  getGroupActivity,
  getGroupRoles
};
