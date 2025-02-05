const { Event, Address, Category, User, BankAccount, Payment } = require("../db");
const { Op } = require("sequelize");
const getMercadoPago = require("../helpers/mercadopago");

const createEvent = async (req, res) => {
  const userId = req.userId;
  const {
    name,
    description,
    large_description,
    start_date,
    end_date,
    start_time,
    end_time,
    isPublic,
    privateEvent_password,
    virtualURL,
    category,
    isPremium,
    typePack,
    items,
    isPaid,
    age_range,
    guests_capacity,
    placeName,
    advertisingTime_start,
    adversiting_end,
    cover_pic,
    address_line,
    city,
    state,
    country,
    price,
    zip_code,
    disability_access,
    parking,
    smoking_zone,
    pet_friendly,
    bankAccount,
  } = req.body;
 

  if((isPublic === false || isPublic === 'false') && !privateEvent_password) {
    return res.status(400).json(
      {
        msg: "private event must have a password"
      }
  )
  }

  try {
    // if (!name ||
    //     !description ||
    //     !start_date ||
    //     !end_date ||
    //     !start_time ||
    //     !end_time ||
    //     !isPublic ||
    //     !privateEvent_password||
    //     !virtualURL ||
    //     !isPremium ||
    //     !isPaid ||
    //     !age_Range ||
    //     !guests_capacity ||
    //     !placeName ||
    //     !created_at ||
    //     !advertisingTime_start ||
    //     !adversiting_end ||
    //     !cover_pic ||
    //     !address_line ||
    //     !state ||
    //     !city ||
    //     !country ||
    //     !zip_code
    //     !disability_access ||
    //     !parking ||
    //     !smoking_zone ||
    //     !pet_friendly
    //     )
    //     {
    //         return res.status(400).json({
    //             error: {
    //                 message: 'name, description, start_date, end_date, isPublic, modality, virtualURL, modalityName, category, address, isPremium, isPaid, age_Range, guests_capacity, placeName, created_at, advertisingTime_start, adversiting_end, cover_pic cannot be empty',
    //                 values: { ...req.body }
    //             }
    //     })
    // }
    const event = await Event.create(
      {
        name,
        description,
        large_description,
        start_date,
        end_date,
        start_time,
        end_time,
        isPublic,
        privateEvent_password,
        virtualURL,
        isPremium,
        isPaid,
        age_range,
        guests_capacity,
        stock_ticket:guests_capacity,
        placeName,
        advertisingTime_start,
        adversiting_end,
        cover_pic,
        disability_access,
        parking,
        smoking_zone,
        pet_friendly,
        price,
        typePack,
        address: {
          address_line,
          city,
          state,
          country,
          zip_code,
        },
      },
      { include: ["address"] }
    ); 

    if (bankAccount) {
      const bankAccountFromDB = await BankAccount.findByPk(bankAccount);
      await bankAccountFromDB.update({ hasAnEvent: true });
      await event.setBankAccount(bankAccountFromDB);
    }

    if (category) {
      const categoryFromDB = await Category.findOne({
        where: { name: category },
      });
      await event.setCategory(categoryFromDB);
    }

    const organizer = await User.findByPk(userId);

    await event.setOrganizer(organizer);
    let preference_id = false

    if(isPremium && items) {

      let itemsParsed = items.map(i => {return {...i, unit_price: Number(i.unit_price), quantity: Number(i.quantity),}})
      const price = items.reduce((acc, val) =>  acc + (val.quantity * val.unit_price),0)
      const client_url = req.protocol + '://' + (req.hostname === 'localhost' ? 'localhost:3000' : req.hostname)
      const server_url = req.headers.host
      preference_id = await getMercadoPago(event.id, itemsParsed, client_url, server_url)

      const payment = await Payment.create({id: preference_id, price})
      await organizer.setPayments(payment)
      await event.setPayment(payment)
      
      event.isActive = false
      await event.save()
    } else {
      if(isPremium) return res.status(401).send({msg: 'items are required'})
    }

    await event.reload({
      include: [
        "bankAccount",
        {
          model: Address,
          as: "address",
          attributes: { exclude: ["id"] },
        },
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "last_name", "profile_pic"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["name", "modality"],
        },
        Payment
      ],
    });
    
    return res.status(201).json({event, preference_id});
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: {
        message: error.message,
      },
    });
  }
};

const checkPrivatePassword = async (req, res) => {

  const { id , privateEvent_password } = req.body;

  try {
    if (!id || !privateEvent_password)
      return res
        .status(400)
        .send({msg : "You must enter an id and a privateEvent_password" })

    const event = await Event.findOne({
      where: {
        id
      },
      include: [
        "bankAccount",
        {
          model: Address,
          as: "address",
          attributes: { exclude: ["id"] },
        },
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "last_name", "profile_pic"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["name", "modality"],
        },
      ],
    });

  if (!event) {
    return res.status(401).send({ msg: " id and privateEvent_password is incorrect" });
  };

  const matchPassword = await event.validPassword(privateEvent_password);
    if (!matchPassword) {
      return res.status(401).send({ msg: "privateEvent_password is incorrect" });
    }
    return res.status(200).json(event);
} catch (error) {
  console.log(error);
  return res.status(500).json({
    error: {
      message: error.message,
    },
  });
}
};

const getEventByUser = async ({ userId }, res) => { 
  try {
    const events = await Event.findAll({
      where: {
        organizerId: userId,
      },
      include: [
        "bankAccount",
        {
          model: Address,
          as: "address",
          attributes: { exclude: ["id"] },
        },
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "last_name", "profile_pic"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["name", "modality"],
        },
      ],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const modifyEvent = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    isPublic,
    virtualURL,
    isPremium,
    isPaid,
    category,
    age_range,
    guests_capacity,
    placeName,
    cover_pic,
    address_line,
    city,
    state,
    privateEvent_password,
    country,
    zip_code,
    disability_access,
    parking,
    smoking_zone,
    pet_friendly,
    bankAccount,
  } = req.body;
  const userId = req.userId;
  try {
    const event = await Event.findOne({
      where: { id },
      include: "organizer",
    });

    if (event.organizer.id === userId) {
      if (bankAccount) {
        const bankAccountFromDB = await BankAccount.findByPk(bankAccount);
        await event.setBankAccount(bankAccountFromDB);
      }

      if (category) {
        const categoryFromDB = await Category.findOne({
          where: { name: category },
        });
        await event.setCategory(categoryFromDB);
      }

      if (address_line && city && state && country && zip_code) {
        const newAddress = await Address.create({
          address_line,
          city,
          state,
          country,
          zip_code,
        });
        await event.setAddress(newAddress);
      }

      if(isPublic === false && !privateEvent_password) {
        return res.status(400).json(
            {
              msg: "private event must have a password"
            }
        )
    }

      await event.update({
        name,
        description,
        start_date,
        end_date,
        start_time,
        end_time,
        isPublic,
        category,
        virtualURL,
        isPremium,
        privateEvent_password,
        isPaid,
        age_range,
        guests_capacity,
        placeName,
        cover_pic,
        disability_access,
        parking,
        smoking_zone,
        pet_friendly,
      });

      await event.reload({
        include: [
          "bankAccount",
          {
            model: Address,
            as: "address",
            attributes: { exclude: ["id"] },
          },
          {
            model: User,
            as: "organizer",
            attributes: ["id", "name", "last_name", "profile_pic"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["name", "modality"],
          },
        ],
        attributes:{exclude: ['privateEvent_password']}
      });

      res.send({ msg: "Data updated successfully", data: event });
    } else {
      res.status(500).send("Sorry! You can not modify this event");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  try {
    const event = await Event.findOne({
      where: { id },
      include: "organizer",
    });
    if (event.organizer.id === userId) {
      await event.update({
        isActive: false,
      });
      const idDeleted = await Event.findOne({
        where: {
          id,
          isActive: false,
        },
      });
      !idDeleted
        ? res.send("Sorry! The event could not be deleted. Please, try again.")
        : res.send("Event removed successfully");
    } else {
      res.status(500).send("Sorry! You can not delete this event");
    }
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const getAllPremiumEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        typePack:'PREMIUM',
      },
      include: [
        "bankAccount",
        {
          model: Address,
          as: "address",
          attributes: { exclude: ["id"] },
        },
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "last_name", "profile_pic"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["name", "modality"],
        },
      ],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createEvent,
  checkPrivatePassword,
  getEventByUser,
  modifyEvent,
  deleteEvent,
  getAllPremiumEvents,
};
